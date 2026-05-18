-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'BUDTENDER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "public"."FacilityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."LicenseType" AS ENUM ('RETAIL', 'CULTIVATION', 'MANUFACTURING', 'DISTRIBUTION', 'TESTING', 'DELIVERY');

-- CreateEnum
CREATE TYPE "public"."ProductCategory" AS ENUM ('FLOWER', 'PRE_ROLL', 'EDIBLE', 'CONCENTRATE', 'VAPE', 'TOPICAL', 'TINCTURE', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."PackageStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'INACTIVE', 'FINISHED', 'IN_TRANSIT');

-- CreateEnum
CREATE TYPE "public"."AdjustmentType" AS ENUM ('MANUAL', 'SALE', 'INTAKE', 'WASTE', 'RECONCILIATION');

-- CreateEnum
CREATE TYPE "public"."SaleStatus" AS ENUM ('DRAFT', 'COMPLETED', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('CASH', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."SyncStatus" AS ENUM ('NOT_SYNCED', 'SYNC_PENDING', 'SYNCED', 'SYNC_FAILED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "public"."SyncJobType" AS ENUM ('PACKAGE_IMPORT', 'PACKAGE_ADJUSTMENT', 'SALES_RECEIPT', 'RECONCILIATION', 'WEBHOOK_PROCESSING');

-- CreateEnum
CREATE TYPE "public"."SyncJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."MetrcCredentialStatus" AS ENUM ('NOT_CONFIGURED', 'ACTIVE', 'DISABLED', 'ROTATION_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."MetrcRequestStatus" AS ENUM ('PENDING', 'SENT', 'SUCCEEDED', 'FAILED', 'RETRYING', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "public"."ReconciliationStatus" AS ENUM ('MATCHED', 'LOCAL_ONLY', 'METRC_ONLY', 'QUANTITY_MISMATCH', 'STATUS_MISMATCH', 'PRODUCT_MISMATCH');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."MemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Facility" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "public"."FacilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FacilityLicense" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "licenseType" "public"."LicenseType" NOT NULL,
    "metrcBaseUrl" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" "public"."ProductCategory" NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "thcPercent" DECIMAL(5,2),
    "cbdPercent" DECIMAL(5,2),
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryPackage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "facilityLicenseId" TEXT,
    "productId" TEXT NOT NULL,
    "metrcPackageId" TEXT,
    "label" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "status" "public"."PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "syncStatus" "public"."SyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "receivedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" "public"."AdjustmentType" NOT NULL,
    "reason" TEXT NOT NULL,
    "quantityDelta" DECIMAL(12,3) NOT NULL,
    "quantityBefore" DECIMAL(12,3) NOT NULL,
    "quantityAfter" DECIMAL(12,3) NOT NULL,
    "syncStatus" "public"."SyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
    "metrcReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "createdById" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "status" "public"."SaleStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentType" "public"."PaymentType" NOT NULL DEFAULT 'CASH',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "syncStatus" "public"."SyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
    "metrcReceiptId" TEXT,
    "completedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaleLineItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "packageId" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "lineTotalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetrcCredential" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "facilityLicenseId" TEXT NOT NULL,
    "status" "public"."MetrcCredentialStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "integratorKeyRef" TEXT NOT NULL,
    "encryptedUserApiKey" TEXT,
    "keyFingerprint" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetrcCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetrcSyncJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "facilityLicenseId" TEXT,
    "type" "public"."SyncJobType" NOT NULL,
    "status" "public"."SyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "syncStatus" "public"."SyncStatus" NOT NULL DEFAULT 'SYNC_PENDING',
    "targetEntityType" TEXT,
    "targetEntityId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetrcSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetrcOutboundRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "facilityLicenseId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status" "public"."MetrcRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseMetrcId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetrcOutboundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetrcWebhookEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT,
    "facilityLicenseId" TEXT,
    "eventType" TEXT NOT NULL,
    "status" "public"."WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "payloadHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetrcWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetrcReconciliationSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "facilityLicenseId" TEXT,
    "packageLabel" TEXT NOT NULL,
    "localPackageId" TEXT,
    "metrcPackageId" TEXT,
    "status" "public"."ReconciliationStatus" NOT NULL,
    "localQuantity" DECIMAL(12,3),
    "metrcQuantity" DECIMAL(12,3),
    "details" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetrcReconciliationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "public"."OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "public"."OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Facility_organizationId_idx" ON "public"."Facility"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_organizationId_code_key" ON "public"."Facility"("organizationId", "code");

-- CreateIndex
CREATE INDEX "FacilityLicense_licenseNumber_idx" ON "public"."FacilityLicense"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityLicense_facilityId_licenseNumber_key" ON "public"."FacilityLicense"("facilityId", "licenseNumber");

-- CreateIndex
CREATE INDEX "Product_facilityId_idx" ON "public"."Product"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organizationId_sku_key" ON "public"."Product"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "InventoryPackage_productId_idx" ON "public"."InventoryPackage"("productId");

-- CreateIndex
CREATE INDEX "InventoryPackage_syncStatus_idx" ON "public"."InventoryPackage"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryPackage_facilityId_label_key" ON "public"."InventoryPackage"("facilityId", "label");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_facilityId_idx" ON "public"."InventoryAdjustment"("facilityId");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_packageId_idx" ON "public"."InventoryAdjustment"("packageId");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_syncStatus_idx" ON "public"."InventoryAdjustment"("syncStatus");

-- CreateIndex
CREATE INDEX "Sale_syncStatus_idx" ON "public"."Sale"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_facilityId_receiptNumber_key" ON "public"."Sale"("facilityId", "receiptNumber");

-- CreateIndex
CREATE INDEX "SaleLineItem_saleId_idx" ON "public"."SaleLineItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleLineItem_packageId_idx" ON "public"."SaleLineItem"("packageId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "public"."AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_facilityId_createdAt_idx" ON "public"."AuditLog"("facilityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "MetrcCredential_status_idx" ON "public"."MetrcCredential"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MetrcCredential_facilityLicenseId_key" ON "public"."MetrcCredential"("facilityLicenseId");

-- CreateIndex
CREATE INDEX "MetrcSyncJob_facilityId_status_idx" ON "public"."MetrcSyncJob"("facilityId", "status");

-- CreateIndex
CREATE INDEX "MetrcSyncJob_targetEntityType_targetEntityId_idx" ON "public"."MetrcSyncJob"("targetEntityType", "targetEntityId");

-- CreateIndex
CREATE INDEX "MetrcOutboundRequest_facilityId_status_idx" ON "public"."MetrcOutboundRequest"("facilityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MetrcOutboundRequest_idempotencyKey_key" ON "public"."MetrcOutboundRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MetrcWebhookEvent_organizationId_createdAt_idx" ON "public"."MetrcWebhookEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "MetrcWebhookEvent_status_idx" ON "public"."MetrcWebhookEvent"("status");

-- CreateIndex
CREATE INDEX "MetrcReconciliationSnapshot_facilityId_capturedAt_idx" ON "public"."MetrcReconciliationSnapshot"("facilityId", "capturedAt");

-- CreateIndex
CREATE INDEX "MetrcReconciliationSnapshot_status_idx" ON "public"."MetrcReconciliationSnapshot"("status");

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Facility" ADD CONSTRAINT "Facility_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FacilityLicense" ADD CONSTRAINT "FacilityLicense_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryPackage" ADD CONSTRAINT "InventoryPackage_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryPackage" ADD CONSTRAINT "InventoryPackage_facilityLicenseId_fkey" FOREIGN KEY ("facilityLicenseId") REFERENCES "public"."FacilityLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryPackage" ADD CONSTRAINT "InventoryPackage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."InventoryPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleLineItem" ADD CONSTRAINT "SaleLineItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleLineItem" ADD CONSTRAINT "SaleLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleLineItem" ADD CONSTRAINT "SaleLineItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."InventoryPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcCredential" ADD CONSTRAINT "MetrcCredential_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcCredential" ADD CONSTRAINT "MetrcCredential_facilityLicenseId_fkey" FOREIGN KEY ("facilityLicenseId") REFERENCES "public"."FacilityLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcSyncJob" ADD CONSTRAINT "MetrcSyncJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcSyncJob" ADD CONSTRAINT "MetrcSyncJob_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcSyncJob" ADD CONSTRAINT "MetrcSyncJob_facilityLicenseId_fkey" FOREIGN KEY ("facilityLicenseId") REFERENCES "public"."FacilityLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcOutboundRequest" ADD CONSTRAINT "MetrcOutboundRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcOutboundRequest" ADD CONSTRAINT "MetrcOutboundRequest_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcOutboundRequest" ADD CONSTRAINT "MetrcOutboundRequest_facilityLicenseId_fkey" FOREIGN KEY ("facilityLicenseId") REFERENCES "public"."FacilityLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcWebhookEvent" ADD CONSTRAINT "MetrcWebhookEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcWebhookEvent" ADD CONSTRAINT "MetrcWebhookEvent_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcWebhookEvent" ADD CONSTRAINT "MetrcWebhookEvent_facilityLicenseId_fkey" FOREIGN KEY ("facilityLicenseId") REFERENCES "public"."FacilityLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcReconciliationSnapshot" ADD CONSTRAINT "MetrcReconciliationSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcReconciliationSnapshot" ADD CONSTRAINT "MetrcReconciliationSnapshot_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetrcReconciliationSnapshot" ADD CONSTRAINT "MetrcReconciliationSnapshot_facilityLicenseId_fkey" FOREIGN KEY ("facilityLicenseId") REFERENCES "public"."FacilityLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
