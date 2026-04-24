import {
  AdjustmentType,
  FacilityStatus,
  LicenseType,
  MemberRole,
  MetrcCredentialStatus,
  MetrcRequestStatus,
  PackageStatus,
  PaymentType,
  PrismaClient,
  ProductCategory,
  ProductStatus,
  ReconciliationStatus,
  SaleStatus,
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
      name: "Demo Operator"
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
      sku: "FL-BLUEDREAM-35",
      category: ProductCategory.FLOWER,
      unitOfMeasure: "each",
      priceCents: 3200,
      thcPercent: "24.8",
      cbdPercent: "0.6",
      status: ProductStatus.ACTIVE
    }
  });

  const gummies = await prisma.product.create({
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

  const cartridge = await prisma.product.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      name: "Live Resin Cartridge 1g",
      sku: "VP-LIVERESIN-1G",
      category: ProductCategory.VAPE,
      unitOfMeasure: "each",
      priceCents: 4200,
      thcPercent: "78.4",
      cbdPercent: "1.2",
      status: ProductStatus.ACTIVE
    }
  });

  const packageOne = await prisma.inventoryPackage.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      productId: blueDream.id,
      metrcPackageId: "fake-metrc-package-1001",
      label: "1A4FF0300000022000001001",
      quantity: "84",
      unitOfMeasure: "each",
      status: PackageStatus.ACTIVE,
      syncStatus: SyncStatus.SYNCED,
      source: "fake-metrc",
      receivedAt: new Date("2026-04-18T18:00:00.000Z"),
      lastSyncedAt: new Date("2026-04-24T08:30:00.000Z")
    }
  });

  const packageTwo = await prisma.inventoryPackage.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      productId: gummies.id,
      metrcPackageId: "fake-metrc-package-1002",
      label: "1A4FF0300000022000001002",
      quantity: "48",
      unitOfMeasure: "each",
      status: PackageStatus.ACTIVE,
      syncStatus: SyncStatus.SYNC_PENDING,
      source: "fake-metrc",
      receivedAt: new Date("2026-04-19T17:00:00.000Z")
    }
  });

  const packageThree = await prisma.inventoryPackage.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      productId: cartridge.id,
      metrcPackageId: "fake-metrc-package-1003",
      label: "1A4FF0300000022000001003",
      quantity: "21",
      unitOfMeasure: "each",
      status: PackageStatus.ON_HOLD,
      syncStatus: SyncStatus.CONFLICT,
      source: "fake-metrc",
      receivedAt: new Date("2026-04-20T16:00:00.000Z")
    }
  });

  await prisma.inventoryAdjustment.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      packageId: packageOne.id,
      actorUserId: user.id,
      type: AdjustmentType.MANUAL,
      reason: "Initial quality check count correction",
      quantityDelta: "-1",
      quantityBefore: "85",
      quantityAfter: "84",
      syncStatus: SyncStatus.SYNCED,
      metrcReason: "Inventory reconciliation",
      notes: "Demo adjustment created during seed."
    }
  });

  const sale = await prisma.sale.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      createdById: user.id,
      receiptNumber: "DBLV-20260424-0001",
      status: SaleStatus.COMPLETED,
      paymentType: PaymentType.CASH,
      subtotalCents: 5000,
      taxCents: 413,
      totalCents: 5413,
      syncStatus: SyncStatus.SYNC_PENDING,
      completedAt: new Date("2026-04-24T19:15:00.000Z")
    }
  });

  await prisma.saleLineItem.createMany({
    data: [
      {
        saleId: sale.id,
        productId: blueDream.id,
        packageId: packageOne.id,
        quantity: "1",
        unitOfMeasure: "each",
        unitPriceCents: 3200,
        lineTotalCents: 3200
      },
      {
        saleId: sale.id,
        productId: gummies.id,
        packageId: packageTwo.id,
        quantity: "1",
        unitOfMeasure: "each",
        unitPriceCents: 1800,
        lineTotalCents: 1800
      }
    ]
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

  await prisma.metrcSyncJob.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      type: SyncJobType.SALES_RECEIPT,
      status: SyncJobStatus.QUEUED,
      syncStatus: SyncStatus.SYNC_PENDING,
      targetEntityType: "Sale",
      targetEntityId: sale.id
    }
  });

  await prisma.metrcOutboundRequest.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      idempotencyKey: "demo-sale-DBLV-20260424-0001",
      method: "POST",
      endpoint: "/sales/v2/receipts",
      status: MetrcRequestStatus.PENDING,
      requestHash: "fake-request-hash-demo-sale-0001"
    }
  });

  await prisma.metrcWebhookEvent.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      eventType: "PackageUpdated",
      status: WebhookStatus.RECEIVED,
      payloadHash: "fake-webhook-payload-hash-0001",
      payload: {
        objectType: "Package",
        label: packageThree.label,
        simulated: true
      }
    }
  });

  await prisma.metrcReconciliationSnapshot.create({
    data: {
      organizationId: organization.id,
      facilityId: facility.id,
      facilityLicenseId: license.id,
      packageLabel: packageThree.label,
      localPackageId: packageThree.id,
      metrcPackageId: "fake-metrc-package-1003",
      status: ReconciliationStatus.STATUS_MISMATCH,
      localQuantity: "21",
      metrcQuantity: "21",
      details: {
        localStatus: "ON_HOLD",
        metrcStatus: "ACTIVE",
        note: "Demo conflict for the sync status page."
      }
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "inventory.package.seeded",
        entityType: "InventoryPackage",
        entityId: packageOne.id,
        after: {
          label: packageOne.label,
          quantity: "84",
          syncStatus: "SYNCED"
        },
        metadata: {
          source: "prisma-seed"
        }
      },
      {
        organizationId: organization.id,
        facilityId: facility.id,
        actorUserId: user.id,
        action: "sale.completed",
        entityType: "Sale",
        entityId: sale.id,
        after: {
          receiptNumber: sale.receiptNumber,
          totalCents: sale.totalCents,
          syncStatus: sale.syncStatus
        },
        metadata: {
          source: "prisma-seed",
          tender: "cash"
        }
      }
    ]
  });

  console.log("Seeded TrackingTHC demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
