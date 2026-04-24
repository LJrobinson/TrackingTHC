import "server-only";

export type MetrcFacilityRef = {
  id: string;
  name: string;
  licenseNumber: string;
  state: string;
};

export type MetrcItem = {
  id: string;
  name: string;
  category: string;
  unitOfMeasure: string;
};

export type MetrcPackage = {
  id: string;
  label: string;
  itemName: string;
  quantity: number;
  unitOfMeasure: string;
  status: "ACTIVE" | "ON_HOLD" | "INACTIVE" | "FINISHED" | "IN_TRANSIT";
  lastModifiedAt: string;
};

export type MetrcPackageFilters = {
  status?: MetrcPackage["status"];
  page?: number;
  pageSize?: number;
};

export type MetrcPaginatedResult<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type MetrcPackageAdjustmentInput = {
  packageLabel: string;
  quantityDelta: number;
  unitOfMeasure: string;
  reason: string;
  adjustmentDate: string;
};

export type MetrcPackageAdjustmentResult = {
  metrcAdjustmentId: string;
  packageLabel: string;
  acceptedAt: string;
};

export type MetrcSalesReceiptInput = {
  externalReceiptNumber: string;
  salesDate: string;
  lineItems: Array<{
    packageLabel: string;
    quantity: number;
    unitOfMeasure: string;
    unitPriceCents: number;
  }>;
};

export type MetrcSalesReceiptResult = {
  metrcReceiptId: string;
  externalReceiptNumber: string;
  acceptedAt: string;
};

export type MetrcAdapterHealth = {
  adapter: "fake" | "metrc-connect";
  ok: boolean;
  checkedAt: string;
  message: string;
};

export type MetrcAdapterContext = {
  organizationId: string;
  facilityId: string;
  facilityLicenseId: string;
  licenseNumber: string;
  state: string;
  baseUrl: string;
};
