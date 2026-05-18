import "server-only";

import { Prisma, SyncJobStatus, SyncJobType, SyncStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { recordAuditEvent } from "@/server/audit/audit.service";
import { getMetrcAdapter } from "@/server/metrc/metrc.service";
import type { OperationalContext } from "@/server/core/context";

type QueueFakeSyncJobInput = Pick<
  OperationalContext,
  "actorUserId" | "organizationId" | "facilityId" | "facilityLicenseId"
> & {
  type: SyncJobType;
  targetEntityType: string;
  targetEntityId: string;
};

function jobSnapshot(job: {
  id: string;
  type: SyncJobType;
  status: SyncJobStatus;
  syncStatus: SyncStatus;
  targetEntityType: string | null;
  targetEntityId: string | null;
  attempts: number;
  lastError: string | null;
}) {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    syncStatus: job.syncStatus,
    targetEntityType: job.targetEntityType,
    targetEntityId: job.targetEntityId,
    attempts: job.attempts,
    lastError: job.lastError
  };
}

export async function queueFakeMetrcSyncJob(input: QueueFakeSyncJobInput) {
  const job = await prisma.metrcSyncJob.create({
    data: {
      organizationId: input.organizationId,
      facilityId: input.facilityId,
      facilityLicenseId: input.facilityLicenseId,
      type: input.type,
      status: SyncJobStatus.PENDING,
      syncStatus: SyncStatus.SYNC_PENDING,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId
    }
  });

  if (input.targetEntityType === "InventoryPackage") {
    await prisma.inventoryPackage.update({
      where: { id: input.targetEntityId },
      data: { syncStatus: SyncStatus.SYNC_PENDING }
    });
  }

  await recordAuditEvent({
    organizationId: input.organizationId,
    facilityId: input.facilityId,
    actorUserId: input.actorUserId,
    action: "metrc.sync_job.created",
    entityType: "MetrcSyncJob",
    entityId: job.id,
    after: jobSnapshot(job)
  });

  return job;
}

function fakeMetrcPackageId(label: string) {
  return `fake-metrc-package-${label.replace(/[^a-zA-Z0-9]/g, "").slice(-12)}`;
}

async function processPackageJob(job: {
  id: string;
  type: SyncJobType;
  organizationId: string;
  facilityId: string;
  facilityLicenseId: string | null;
  targetEntityId: string | null;
}) {
  if (!job.targetEntityId) {
    throw new Error("Sync job is missing a package target.");
  }

  const inventoryPackage = await prisma.inventoryPackage.findUnique({
    where: { id: job.targetEntityId },
    include: {
      facilityLicense: true,
      product: true
    }
  });

  if (!inventoryPackage) {
    throw new Error("Related package was not found.");
  }

  const adapter = getMetrcAdapter();
  const context = {
    organizationId: job.organizationId,
    facilityId: job.facilityId,
    facilityLicenseId: inventoryPackage.facilityLicenseId ?? job.facilityLicenseId ?? "",
    licenseNumber: inventoryPackage.facilityLicense?.licenseNumber ?? "FAKE-LICENSE",
    state: inventoryPackage.facilityLicense?.state ?? "NA",
    baseUrl: inventoryPackage.facilityLicense?.metrcBaseUrl ?? "https://fake.metrc.local"
  };

  if (job.type === SyncJobType.PACKAGE_ADJUSTMENT) {
    const adjustment = await prisma.inventoryAdjustment.findFirst({
      where: {
        packageId: inventoryPackage.id,
        syncStatus: SyncStatus.SYNC_PENDING
      },
      orderBy: { createdAt: "asc" }
    });

    await adapter.adjustPackage(context, {
      packageLabel: inventoryPackage.label,
      quantityDelta: adjustment ? Number(adjustment.quantityDelta.toString()) : 0,
      unitOfMeasure: inventoryPackage.unitOfMeasure,
      reason: adjustment?.reason ?? "Manual inventory sync",
      adjustmentDate: new Date().toISOString()
    });

    if (adjustment) {
      await prisma.inventoryAdjustment.update({
        where: { id: adjustment.id },
        data: { syncStatus: SyncStatus.SYNCED }
      });
    }
  } else {
    await adapter.healthCheck();
  }

  await prisma.inventoryPackage.update({
    where: { id: inventoryPackage.id },
    data: {
      syncStatus: SyncStatus.SYNCED,
      metrcPackageId: inventoryPackage.metrcPackageId ?? fakeMetrcPackageId(inventoryPackage.label),
      lastSyncedAt: new Date()
    }
  });
}

export async function processPendingFakeSyncJobs(actorUserId: string | null) {
  const pendingJobs = await prisma.metrcSyncJob.findMany({
    where: { status: SyncJobStatus.PENDING },
    orderBy: { createdAt: "asc" },
    take: 25
  });

  let processed = 0;

  for (const pendingJob of pendingJobs) {
    const runningJob = await prisma.metrcSyncJob.update({
      where: { id: pendingJob.id },
      data: {
        status: SyncJobStatus.RUNNING,
        attempts: { increment: 1 },
        startedAt: new Date(),
        lastError: null
      }
    });

    try {
      if (runningJob.targetEntityType === "InventoryPackage") {
        await processPackageJob(runningJob);
      } else {
        await getMetrcAdapter().healthCheck();
      }

      const completedJob = await prisma.metrcSyncJob.update({
        where: { id: runningJob.id },
        data: {
          status: SyncJobStatus.SUCCEEDED,
          syncStatus: SyncStatus.SYNCED,
          completedAt: new Date(),
          lastError: null
        }
      });

      await recordAuditEvent({
        organizationId: completedJob.organizationId,
        facilityId: completedJob.facilityId,
        actorUserId,
        action: "metrc.sync_job.succeeded",
        entityType: "MetrcSyncJob",
        entityId: completedJob.id,
        after: jobSnapshot(completedJob)
      });

      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fake Metrc sync failed.";
      const failedJob = await prisma.metrcSyncJob.update({
        where: { id: runningJob.id },
        data: {
          status: SyncJobStatus.FAILED,
          syncStatus: SyncStatus.SYNC_FAILED,
          completedAt: new Date(),
          lastError: message
        }
      });

      if (runningJob.targetEntityType === "InventoryPackage" && runningJob.targetEntityId) {
        await prisma.inventoryPackage.update({
          where: { id: runningJob.targetEntityId },
          data: { syncStatus: SyncStatus.SYNC_FAILED }
        });
      }

      await recordAuditEvent({
        organizationId: failedJob.organizationId,
        facilityId: failedJob.facilityId,
        actorUserId,
        action: "metrc.sync_job.failed",
        entityType: "MetrcSyncJob",
        entityId: failedJob.id,
        after: {
          ...jobSnapshot(failedJob),
          error: message
        } satisfies Prisma.InputJsonObject
      });
    }
  }

  return { processed, total: pendingJobs.length };
}

export async function simulateFakeSyncJobFailure(input: {
  actorUserId: string | null;
  jobId: string;
  reason: string;
}) {
  if (!input.jobId) {
    throw new Error("Select a sync job to fail.");
  }

  if (!input.reason) {
    throw new Error("Failure reason is required.");
  }

  const existingJob = await prisma.metrcSyncJob.findUniqueOrThrow({
    where: { id: input.jobId }
  });

  if (existingJob.status === SyncJobStatus.SUCCEEDED) {
    throw new Error("Succeeded jobs cannot be manually failed.");
  }

  const failedJob = await prisma.metrcSyncJob.update({
    where: { id: input.jobId },
    data: {
      status: SyncJobStatus.FAILED,
      syncStatus: SyncStatus.SYNC_FAILED,
      attempts: { increment: 1 },
      completedAt: new Date(),
      lastError: input.reason
    }
  });

  if (failedJob.targetEntityType === "InventoryPackage" && failedJob.targetEntityId) {
    await prisma.inventoryPackage.update({
      where: { id: failedJob.targetEntityId },
      data: { syncStatus: SyncStatus.SYNC_FAILED }
    });
  }

  await recordAuditEvent({
    organizationId: failedJob.organizationId,
    facilityId: failedJob.facilityId,
    actorUserId: input.actorUserId,
    action: "metrc.sync_job.failed",
    entityType: "MetrcSyncJob",
    entityId: failedJob.id,
    before: jobSnapshot(existingJob),
    after: {
      ...jobSnapshot(failedJob),
      error: input.reason,
      simulated: true
    } satisfies Prisma.InputJsonObject
  });

  return failedJob;
}
