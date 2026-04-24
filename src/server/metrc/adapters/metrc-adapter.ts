import "server-only";

import type {
  MetrcAdapterContext,
  MetrcAdapterHealth,
  MetrcFacilityRef,
  MetrcItem,
  MetrcPackage,
  MetrcPackageAdjustmentInput,
  MetrcPackageAdjustmentResult,
  MetrcPackageFilters,
  MetrcPaginatedResult,
  MetrcSalesReceiptInput,
  MetrcSalesReceiptResult
} from "../metrc.types";

export interface MetrcAdapter {
  healthCheck(): Promise<MetrcAdapterHealth>;
  getFacilities(): Promise<MetrcFacilityRef[]>;
  getItems(context: MetrcAdapterContext): Promise<MetrcItem[]>;
  getPackages(
    context: MetrcAdapterContext,
    filters?: MetrcPackageFilters
  ): Promise<MetrcPaginatedResult<MetrcPackage>>;
  getPackageByLabel(context: MetrcAdapterContext, label: string): Promise<MetrcPackage | null>;
  adjustPackage(
    context: MetrcAdapterContext,
    input: MetrcPackageAdjustmentInput
  ): Promise<MetrcPackageAdjustmentResult>;
  createSalesReceipt(
    context: MetrcAdapterContext,
    input: MetrcSalesReceiptInput
  ): Promise<MetrcSalesReceiptResult>;
  voidSalesReceipt(context: MetrcAdapterContext, metrcReceiptId: string): Promise<void>;
}
