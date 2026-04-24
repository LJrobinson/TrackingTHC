"use server";

import {
  AdjustmentType,
  PackageStatus,
  Prisma,
  ProductStatus,
  SyncJobType,
  SyncStatus
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { recordAuditEvent } from "@/server/audit/audit.service";
import { getOperationalContext } from "@/server/core/context";
import { queueFakeMetrcSyncJob } from "@/server/metrc/fake-sync.service";
import { assertPermission } from "@/server/auth/permissions";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Enter a valid date.");
  }

  return date;
}

function getDecimal(value: string, label: string) {
  if (!value) {
    throw new Error(`${label} is required.`);
  }

  let decimal: Prisma.Decimal;

  try {
    decimal = new Prisma.Decimal(value);
  } catch {
    throw new Error(`${label} must be a valid number.`);
  }

  if (!Number.isFinite(Number(decimal.toString()))) {
    throw new Error(`${label} must be a valid number.`);
  }

  return decimal;
}

function getPackageStatus(value: string) {
  if (Object.values(PackageStatus).includes(value as PackageStatus)) {
    return value as PackageStatus;
  }

  throw new Error("Select a valid package status.");
}

function packageSnapshot(inventoryPackage: {
  id: string;
  productId: string;
  label: string;
  quantity: Prisma.Decimal;
  unitOfMeasure: string;
  status: PackageStatus;
  source: string;
  receivedAt: Date | null;
  expiresAt: Date | null;
  syncStatus: SyncStatus;
}) {
  return {
    id: inventoryPackage.id,
    productId: inventoryPackage.productId,
    label: inventoryPackage.label,
    quantity: inventoryPackage.quantity.toString(),
    unitOfMeasure: inventoryPackage.unitOfMeasure,
    status: inventoryPackage.status,
    source: inventoryPackage.source,
    receivedAt: inventoryPackage.receivedAt?.toISOString() ?? null,
    expiresAt: inventoryPackage.expiresAt?.toISOString() ?? null,
    syncStatus: inventoryPackage.syncStatus
  };
}

function revalidateInventoryPaths(packageId?: string) {
  revalidatePath("/inventory");
  revalidatePath("/sync-status");
  revalidatePath("/dashboard");

  if (packageId) {
    revalidatePath(`/inventory/${packageId}`);
  }
}

export async function createPackage(formData: FormData) {
  await assertPermission("inventory:write");

  const context = await getOperationalContext();
  const label = getText(formData, "label");
  const productId = getText(formData, "productId");
  const quantity = getDecimal(getText(formData, "quantity"), "Quantity");
  const unitOfMeasure = getText(formData, "unitOfMeasure") || "each";

  if (!label || !productId) {
    throw new Error("Package label and product are required.");
  }

  if (!unitOfMeasure) {
    throw new Error("Unit is required.");
  }

  if (quantity.isNegative()) {
    throw new Error("Package quantity cannot be negative.");
  }

  await prisma.product.findFirstOrThrow({
    where: {
      id: productId,
      organizationId: context.organizationId,
      status: ProductStatus.ACTIVE
    }
  });

  const existingPackage = await prisma.inventoryPackage.findUnique({
    where: {
      facilityId_label: {
        facilityId: context.facilityId,
        label
      }
    }
  });

  if (existingPackage) {
    throw new Error("A package with this label already exists at this facility.");
  }

  const inventoryPackage = await prisma.inventoryPackage.create({
    data: {
      organizationId: context.organizationId,
      facilityId: context.facilityId,
      facilityLicenseId: context.facilityLicenseId,
      productId,
      label,
      quantity,
      unitOfMeasure,
      status: getPackageStatus(getText(formData, "status") || PackageStatus.ACTIVE),
      source: getText(formData, "source") || "manual",
      receivedAt: getOptionalDate(getText(formData, "receivedAt")),
      expiresAt: getOptionalDate(getText(formData, "expiresAt")),
      syncStatus: SyncStatus.SYNC_PENDING
    }
  });

  await recordAuditEvent({
    organizationId: context.organizationId,
    facilityId: context.facilityId,
    actorUserId: context.actorUserId,
    action: "inventory.package.created",
    entityType: "InventoryPackage",
    entityId: inventoryPackage.id,
    after: packageSnapshot(inventoryPackage)
  });

  await queueFakeMetrcSyncJob({
    ...context,
    type: SyncJobType.PACKAGE_IMPORT,
    targetEntityType: "InventoryPackage",
    targetEntityId: inventoryPackage.id
  });

  revalidateInventoryPaths(inventoryPackage.id);
}

export async function updatePackage(formData: FormData) {
  await assertPermission("inventory:write");

  const context = await getOperationalContext();
  const id = getText(formData, "packageId");
  const before = await prisma.inventoryPackage.findUniqueOrThrow({ where: { id } });
  const label = getText(formData, "label");
  const productId = getText(formData, "productId");
  const unitOfMeasure = getText(formData, "unitOfMeasure") || "each";

  if (!label || !productId) {
    throw new Error("Package label and product are required.");
  }

  const existingPackage = await prisma.inventoryPackage.findUnique({
    where: {
      facilityId_label: {
        facilityId: context.facilityId,
        label
      }
    }
  });

  if (existingPackage && existingPackage.id !== id) {
    throw new Error("A different package already uses this label at this facility.");
  }

  const inventoryPackage = await prisma.inventoryPackage.update({
    where: { id },
    data: {
      productId,
      label,
      unitOfMeasure,
      status: getPackageStatus(getText(formData, "status")),
      source: getText(formData, "source") || "manual",
      receivedAt: getOptionalDate(getText(formData, "receivedAt")),
      expiresAt: getOptionalDate(getText(formData, "expiresAt"))
    }
  });

  await recordAuditEvent({
    organizationId: context.organizationId,
    facilityId: context.facilityId,
    actorUserId: context.actorUserId,
    action: "inventory.package.updated",
    entityType: "InventoryPackage",
    entityId: inventoryPackage.id,
    before: packageSnapshot(before),
    after: packageSnapshot(inventoryPackage)
  });

  revalidateInventoryPaths(inventoryPackage.id);
}

export async function archivePackage(formData: FormData) {
  await assertPermission("inventory:write");

  const context = await getOperationalContext();
  const id = getText(formData, "packageId");
  const before = await prisma.inventoryPackage.findUniqueOrThrow({ where: { id } });
  const inventoryPackage = await prisma.inventoryPackage.update({
    where: { id },
    data: { status: PackageStatus.FINISHED }
  });

  await recordAuditEvent({
    organizationId: context.organizationId,
    facilityId: context.facilityId,
    actorUserId: context.actorUserId,
    action: "inventory.package.archived",
    entityType: "InventoryPackage",
    entityId: inventoryPackage.id,
    before: packageSnapshot(before),
    after: packageSnapshot(inventoryPackage)
  });

  revalidateInventoryPaths(inventoryPackage.id);
}

export async function adjustPackageQuantity(formData: FormData) {
  await assertPermission("inventory:write");

  const context = await getOperationalContext();
  const packageId = getText(formData, "packageId");
  const delta = getDecimal(getText(formData, "quantityDelta"), "Adjustment quantity");
  const reason = getText(formData, "reason");

  if (delta.isZero()) {
    throw new Error("Adjustment quantity cannot be zero.");
  }

  if (!reason) {
    throw new Error("Adjustment reason is required.");
  }

  const inventoryPackage = await prisma.inventoryPackage.findUniqueOrThrow({
    where: { id: packageId }
  });
  const quantityBefore = inventoryPackage.quantity;
  const quantityAfter = quantityBefore.plus(delta);

  if (quantityAfter.isNegative()) {
    throw new Error("Adjustment would create negative inventory.");
  }

  const updatedPackage = await prisma.inventoryPackage.update({
    where: { id: packageId },
    data: {
      quantity: quantityAfter,
      syncStatus: SyncStatus.SYNC_PENDING
    }
  });

  const adjustment = await prisma.inventoryAdjustment.create({
    data: {
      organizationId: context.organizationId,
      facilityId: context.facilityId,
      packageId,
      actorUserId: context.actorUserId,
      type: AdjustmentType.MANUAL,
      reason,
      quantityDelta: delta,
      quantityBefore,
      quantityAfter,
      syncStatus: SyncStatus.SYNC_PENDING,
      metrcReason: reason
    }
  });

  await recordAuditEvent({
    organizationId: context.organizationId,
    facilityId: context.facilityId,
    actorUserId: context.actorUserId,
    action: "inventory.adjustment.created",
    entityType: "InventoryAdjustment",
    entityId: adjustment.id,
    before: {
      packageId,
      quantity: quantityBefore.toString()
    },
    after: {
      packageId,
      quantityDelta: delta.toString(),
      quantity: quantityAfter.toString(),
      reason
    }
  });

  await queueFakeMetrcSyncJob({
    ...context,
    type: SyncJobType.PACKAGE_ADJUSTMENT,
    targetEntityType: "InventoryPackage",
    targetEntityId: updatedPackage.id
  });

  revalidateInventoryPaths(updatedPackage.id);
}
