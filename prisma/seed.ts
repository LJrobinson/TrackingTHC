import {
  AdjustmentType,
  FacilityStatus,
  LicenseType,
  MemberRole,
  MetrcCredentialStatus,
  MetrcRequestStatus,
  PackageStatus,
  PrismaClient,
  ProductCategory,
  ProductStatus,
  ReconciliationStatus,
  SyncJobStatus,
  SyncJobType,
  SyncStatus,
  WebhookStatus
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.metrcReconciliationSnapshot.deleteMany();
  await prisma.metrcWebhookEvent.deleteMany();
  await prisma.metrcOutboundRequest.deleteMany();
  await prisma.metrcSyncJob.deleteMany();
  await prisma.metrcCredential.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.saleLineItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventoryAdjustment.deleteMany();
  await prisma.inventoryPackage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.facilityLicense.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "operator@trackingthc.local",
      name: "Maya Torres"
    }
  });

  const organization = await prisma.organization.create({
    data: {
      name: "Desert Bloom Cannabis Co.",
      slug: "desert-bloom"
    }
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      role: MemberRole.OWNER
    }
  });

  const facility = await prisma.facility.create({
    data: {
      organizationId: organization.id,
      name: "Desert Bloom Retail - Las Vegas",
      code: "DBLV-01",
      status: FacilityStatus.ACTIVE,
      timezone: "America/Los_Angeles"
    }
  });

  const license = await prisma.facilityLicense.create({
    data: {
      facilityId: facility.id,
      licenseNumber: "NV-RTL-000042",
      state: "NV",
      licenseType: LicenseType.RETAIL,
      metrcBaseUrl: "https://api-nv.metrc.example",
      isPrimary: true
    }
  });

  const blueDream = await prisma.product.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      name: "Blue Dream 3.5g",
      sku: "FL-BLUE-DREAM-35",
      category: ProductCategory.FLOWER,
      unitOfMeasure: "each",
      priceCents: 3200,
      thcPercent: "24.8",
      cbdPercent: "0.6",
      status: ProductStatus.ACTIVE
    }
  });

  const desertPreRolls = await prisma.product.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      name: "Desert Bloom Pre-Roll 1g",
      sku: "PR-DESERT-1G",
      category: ProductCategory.PRE_ROLL,
      unitOfMeasure: "each",
      priceCents: 1200,
      thcPercent: "22.1",
      cbdPercent: "0.3",
      status: ProductStatus.ACTIVE
    }
  });

  const liveResinCart = await prisma.product.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      name: "Live Resin Cartridge 1g",
      sku: "VP-LIVE-RESIN-1G",
      category: ProductCategory.VAPE,
      unitOfMeasure: "each",
      priceCents: 4200,
      thcPercent: "78.4",
      cbdPercent: "1.2",
      status: ProductStatus.ACTIVE
    }
  });

  const citrusGummies = await prisma.product.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      name: "Citrus Gummies 100mg",
      sku: "ED-CITRUS-100",
      category: ProductCategory.EDIBLE,
      unitOfMeasure: "each",
      priceCents: 1800,
      thcPercent: "0.0",
      cbdPercent: "0.0",
      status: ProductStatus.ACTIVE
    }
  });

  const rosinBadder = await prisma.product.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      name: "Hash Rosin Badder 1g",
      sku: "CN-ROSIN-BADDER-1G",
      category: ProductCategory.CONCENTRATE,
      unitOfMeasure: "each",
      priceCents: 5200,
      thcPercent: "71.5",
      cbdPercent: "0.4",
      status: ProductStatus.ACTIVE
    }
  });

  const archivedTopical = await prisma.product.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      name: "Lavender Relief Balm 250mg",
      sku: "TP-LAV-BALM-250",
      category: ProductCategory.TOPICAL,
      unitOfMeasure: "each",
      priceCents: 2800,
      thcPercent: "0.0",
      cbdPercent: "0.0",
      status: ProductStatus.ARCHIVED
    }
  });

  const flowerPackage = await prisma.inventoryPackage.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      productId: blueDream.id,
      metrcPackageId: "fake-metrc-package-2001",
      label: "1A4FF0300000022000002001",
      quantity: "62",
      unitOfMeasure: "each",
      status: PackageStatus.ACTIVE,
      syncStatus: SyncStatus.SYNCED,
      source: "fake-metrc",
      receivedAt: new Date("2026-04-16T17:00:00.000Z"),
      expiresAt: new Date("2027-04-16T07:00:00.000Z"),
      lastSyncedAt: new Date("2026-04-24T15:15:00.000Z")
    }
  });

  const preRollPackage = await prisma.inventoryPackage.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      productId: desertPreRolls.id,
      metrcPackageId: "fake-metrc-package-2002",
      label: "1A4FF0300000022000002002",
      quantity: "144",
      unitOfMeasure: "each",
      status: PackageStatus.ACTIVE,
      syncStatus: SyncStatus.SYNC_PENDING,
      source: "manual-intake",
      receivedAt: new Date("2026-04-19T16:00:00.000Z"),
      expiresAt: new Date("2027-04-19T07:00:00.000Z")
    }
  });

  const vapePackage = await prisma.inventoryPackage.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      productId: liveResinCart.id,
      metrcPackageId: "fake-metrc-package-2003",
      label: "1A4FF0300000022000002003",
      quantity: "4",
      unitOfMeasure: "each",
      status: PackageStatus.ACTIVE,
      syncStatus: SyncStatus.SYNC_FAILED,
      source: "fake-metrc",
      receivedAt: new Date("2026-04-12T18:30:00.000Z"),
      expiresAt: new Date("2027-04-12T07:00:00.000Z"),
      lastSyncedAt: new Date("2026-04-23T21:45:00.000Z")
    }
  });

  const ediblePackage = await prisma.inventoryPackage.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      productId: citrusGummies.id,
      metrcPackageId: "fake-metrc-package-2004",
      label: "1A4FF0300000022000002004",
      quantity: "9",
      unitOfMeasure: "each",
      status: PackageStatus.ACTIVE,
      syncStatus: SyncStatus.CONFLICT,
      source: "fake-metrc",
      receivedAt: new Date("2026-04-17T19:20:00.000Z"),
      expiresAt: new Date("2026-10-17T07:00:00.000Z")
    }
  });

  const concentratePackage = await prisma.inventoryPackage.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      productId: rosinBadder.id,
      metrcPackageId: "fake-metrc-package-2005",
      label: "1A4FF0300000022000002005",
      quantity: "18",
      unitOfMeasure: "each",
      status: PackageStatus.ON_HOLD,
      syncStatus: SyncStatus.NOT_SYNCED,
      source: "manual-intake",
      receivedAt: new Date("2026-04-22T20:00:00.000Z"),
      expiresAt: new Date("2027-01-22T08:00:00.000Z")
    }
  });

  const finishedTopicalPackage = await prisma.inventoryPackage.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      productId: archivedTopical.id,
      metrcPackageId: "fake-metrc-package-2006",
      label: "1A4FF0300000022000002006",
      quantity: "0",
      unitOfMeasure: "each",
      status: PackageStatus.FINISHED,
      syncStatus: SyncStatus.SYNCED,
      source: "fake-metrc",
      receivedAt: new Date("2026-03-28T17:00:00.000Z"),
      expiresAt: new Date("2026-09-28T07:00:00.000Z"),
      lastSyncedAt: new Date("2026-04-21T17:05:00.000Z")
    }
  });

  const flowerAdjustment = await prisma.inventoryAdjustment.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      packageId: flowerPackage.id,
      actorUserId: user.id,
      type: AdjustmentType.MANUAL,
      reason: "Opening count correction",
      quantityDelta: "-2",
      quantityBefore: "64",
      quantityAfter: "62",
      syncStatus: SyncStatus.SYNCED,
      metrcReason: "Inventory reconciliation",
      notes: "Demo correction after morning count."
    }
  });

  const vapeAdjustment = await prisma.inventoryAdjustment.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      packageId: vapePackage.id,
      actorUserId: user.id,
      type: AdjustmentType.RECONCILIATION,
      reason: "Low stock recount",
      quantityDelta: "-1",
      quantityBefore: "5",
      quantityAfter: "4",
      syncStatus: SyncStatus.SYNC_FAILED,
      metrcReason: "Inventory reconciliation",
      notes: "Fake sync failure shows needs-attention workflow."
    }
  });

  const edibleAdjustment = await prisma.inventoryAdjustment.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      packageId: ediblePackage.id,
      actorUserId: user.id,
      type: AdjustmentType.MANUAL,
      reason: "Display unit removed from sellable stock",
      quantityDelta: "-1",
      quantityBefore: "10",
      quantityAfter: "9",
      syncStatus: SyncStatus.SYNC_PENDING,
      metrcReason: "Display inventory adjustment",
      notes: "Pending job is available for the sync demo."
    }
  });

  await prisma.metrcCredential.create({
    data: {
      facilityId: facility.id,
      facilityLicenseId: license.id,
      status: MetrcCredentialStatus.NOT_CONFIGURED,
      integratorKeyRef: "env:METRC_INTEGRATOR_API_KEY",
      encryptedUserApiKey: null,
      keyFingerprint: null
    }
  });

  const succeededJob = await prisma.metrcSyncJob.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      type: SyncJobType.PACKAGE_IMPORT,
      status: SyncJobStatus.SUCCEEDED,
      syncStatus: SyncStatus.SYNCED,
      targetEntityType: "InventoryPackage",
      targetEntityId: flowerPackage.id,
      attempts: 1,
      startedAt: new Date("2026-04-24T15:14:00.000Z"),
      completedAt: new Date("2026-04-24T15:15:00.000Z")
    }
  });

  const pendingJob = await prisma.metrcSyncJob.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      type: SyncJobType.PACKAGE_IMPORT,
      status: SyncJobStatus.PENDING,
      syncStatus: SyncStatus.SYNC_PENDING,
      targetEntityType: "InventoryPackage",
      targetEntityId: preRollPackage.id
    }
  });

  const failedJob = await prisma.metrcSyncJob.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      type: SyncJobType.PACKAGE_ADJUSTMENT,
      status: SyncJobStatus.FAILED,
      syncStatus: SyncStatus.SYNC_FAILED,
      targetEntityType: "InventoryPackage",
      targetEntityId: vapePackage.id,
      attempts: 2,
      startedAt: new Date("2026-04-24T16:05:00.000Z"),
      completedAt: new Date("2026-04-24T16:06:00.000Z"),
      lastError: "Fake Metrc rejected adjustment: package quantity mismatch."
    }
  });

  const runningJob = await prisma.metrcSyncJob.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      type: SyncJobType.PACKAGE_ADJUSTMENT,
      status: SyncJobStatus.RUNNING,
      syncStatus: SyncStatus.SYNC_PENDING,
      targetEntityType: "InventoryPackage",
      targetEntityId: ediblePackage.id,
      attempts: 1,
      startedAt: new Date("2026-04-24T16:40:00.000Z")
    }
  });

  const notSyncedJob = await prisma.metrcSyncJob.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      type: SyncJobType.PACKAGE_IMPORT,
      status: SyncJobStatus.PENDING,
      syncStatus: SyncStatus.SYNC_PENDING,
      targetEntityType: "InventoryPackage",
      targetEntityId: concentratePackage.id
    }
  });

  await prisma.metrcOutboundRequest.createMany({
    data: [
      {
        organizationId: organization.id,
        facilityId: facility.id,
        facilityLicenseId: license.id,
        idempotencyKey: "demo-package-import-2001",
        method: "POST",
        endpoint: "/packages/v2/create",
        status: MetrcRequestStatus.SUCCEEDED,
        requestHash: "fake-request-hash-package-2001",
        responseStatus: 200,
        responseMetrcId: "fake-metrc-package-2001",
        sentAt: new Date("2026-04-24T15:14:30.000Z"),
        completedAt: new Date("2026-04-24T15:15:00.000Z")
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        facilityLicenseId: license.id,
        idempotencyKey: "demo-adjustment-2003",
        method: "POST",
        endpoint: "/packages/v2/adjust",
        status: MetrcRequestStatus.FAILED,
        requestHash: "fake-request-hash-adjustment-2003",
        responseStatus: 409,
        errorCode: "FAKE_QUANTITY_MISMATCH",
        errorMessage: "Fake Metrc rejected adjustment: package quantity mismatch.",
        attemptCount: 2,
        sentAt: new Date("2026-04-24T16:05:30.000Z"),
        completedAt: new Date("2026-04-24T16:06:00.000Z")
      }
    ]
  });

  await prisma.metrcWebhookEvent.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      eventType: "PackageUpdated",
      status: WebhookStatus.RECEIVED,
      payloadHash: "fake-webhook-payload-hash-2004",
      payload: {
        objectType: "Package",
        label: ediblePackage.label,
        simulated: true
      }
    }
  });

  await prisma.metrcReconciliationSnapshot.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      packageLabel: ediblePackage.label,
      localPackageId: ediblePackage.id,
      metrcPackageId: "fake-metrc-package-2004",
      status: ReconciliationStatus.QUANTITY_MISMATCH,
      localQuantity: "9",
      metrcQuantity: "10",
      details: {
        localStatus: "ACTIVE",
        metrcStatus: "ACTIVE",
        note: "Demo conflict: local display adjustment has not reconciled yet."
      }
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "product.created",
        entityType: "Product",
        entityId: blueDream.id,
        after: {
          name: blueDream.name,
          sku: blueDream.sku,
          category: blueDream.category
        },
        metadata: {
          source: "prisma-seed",
          demo: "catalog"
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "inventory.package.created",
        entityType: "InventoryPackage",
        entityId: preRollPackage.id,
        after: {
          label: preRollPackage.label,
          quantity: "144",
          syncStatus: "SYNC_PENDING"
        },
        metadata: {
          source: "prisma-seed",
          demo: "pending sync"
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "inventory.adjustment.created",
        entityType: "InventoryAdjustment",
        entityId: flowerAdjustment.id,
        before: {
          packageId: flowerPackage.id,
          quantity: "64"
        },
        after: {
          packageId: flowerPackage.id,
          quantityDelta: "-2",
          quantity: "62"
        },
        metadata: {
          source: "prisma-seed",
          reason: "Opening count correction"
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "inventory.adjustment.created",
        entityType: "InventoryAdjustment",
        entityId: vapeAdjustment.id,
        before: {
          packageId: vapePackage.id,
          quantity: "5"
        },
        after: {
          packageId: vapePackage.id,
          quantityDelta: "-1",
          quantity: "4"
        },
        metadata: {
          source: "prisma-seed",
          reason: "Low stock recount"
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "inventory.adjustment.created",
        entityType: "InventoryAdjustment",
        entityId: edibleAdjustment.id,
        before: {
          packageId: ediblePackage.id,
          quantity: "10"
        },
        after: {
          packageId: ediblePackage.id,
          quantityDelta: "-1",
          quantity: "9"
        },
        metadata: {
          source: "prisma-seed",
          reason: "Display unit removed from sellable stock"
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "metrc.sync_job.succeeded",
        entityType: "MetrcSyncJob",
        entityId: succeededJob.id,
        after: {
          status: "SUCCEEDED",
          targetEntityId: flowerPackage.id
        },
        metadata: {
          source: "prisma-seed",
          adapter: "fake"
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "metrc.sync_job.created",
        entityType: "MetrcSyncJob",
        entityId: pendingJob.id,
        after: {
          status: "PENDING",
          targetEntityId: preRollPackage.id
        },
        metadata: {
          source: "prisma-seed",
          adapter: "fake"
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "metrc.sync_job.failed",
        entityType: "MetrcSyncJob",
        entityId: failedJob.id,
        after: {
          status: "FAILED",
          targetEntityId: vapePackage.id,
          error: failedJob.lastError
        },
        metadata: {
          source: "prisma-seed",
          adapter: "fake",
          simulated: true
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "metrc.sync_job.running",
        entityType: "MetrcSyncJob",
        entityId: runningJob.id,
        after: {
          status: "RUNNING",
          targetEntityId: ediblePackage.id
        },
        metadata: {
          source: "prisma-seed",
          adapter: "fake"
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "metrc.sync_job.created",
        entityType: "MetrcSyncJob",
        entityId: notSyncedJob.id,
        after: {
          status: "PENDING",
          targetEntityId: concentratePackage.id
        },
        metadata: {
          source: "prisma-seed",
          adapter: "fake",
          demo: "not synced package"
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "inventory.package.archived",
        entityType: "InventoryPackage",
        entityId: finishedTopicalPackage.id,
        after: {
          label: finishedTopicalPackage.label,
          status: "FINISHED",
          quantity: "0"
        },
        metadata: {
          source: "prisma-seed",
          demo: "finished package"
        }
      }
    ]
  });

  console.log("Seeded TrackingTHC portfolio demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
