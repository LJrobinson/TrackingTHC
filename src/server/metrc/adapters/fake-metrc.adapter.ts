import "server-only";

import type { MetrcAdapter } from "./metrc-adapter";
import type {
  MetrcAdapterContext,
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

const fakeFacilities: MetrcFacilityRef[] = [
  {
    id: "fake-facility-nv-retail",
    name: "Desert Bloom Retail",
    licenseNumber: "NV-RTL-000042",
    state: "NV"
  }
];

const fakeItems: MetrcItem[] = [
  {
    id: "fake-item-blue-dream",
    name: "Blue Dream 3.5g",
    category: "Flower",
    unitOfMeasure: "each"
  },
  {
    id: "fake-item-citrus-gummies",
    name: "Citrus Gummies 100mg",
    category: "Edible",
    unitOfMeasure: "each"
  },
  {
    id: "fake-item-live-resin",
    name: "Live Resin Cartridge 1g",
    category: "Vape",
    unitOfMeasure: "each"
  }
];

const fakePackages: MetrcPackage[] = [
  {
    id: "fake-metrc-package-1001",
    label: "1A4FF0300000022000001001",
    itemName: "Blue Dream 3.5g",
    quantity: 84,
    unitOfMeasure: "each",
    status: "ACTIVE",
    lastModifiedAt: "2026-04-24T08:30:00.000Z"
  },
  {
    id: "fake-metrc-package-1002",
    label: "1A4FF0300000022000001002",
    itemName: "Citrus Gummies 100mg",
    quantity: 48,
    unitOfMeasure: "each",
    status: "ACTIVE",
    lastModifiedAt: "2026-04-24T08:45:00.000Z"
  },
  {
    id: "fake-metrc-package-1003",
    label: "1A4FF0300000022000001003",
    itemName: "Live Resin Cartridge 1g",
    quantity: 21,
    unitOfMeasure: "each",
    status: "ON_HOLD",
    lastModifiedAt: "2026-04-24T09:00:00.000Z"
  }
];

function nowIso() {
  return new Date().toISOString();
}

function fakeId(prefix: string, input: string) {
  const cleaned = input.replace(/[^a-zA-Z0-9]/g, "").slice(-10);
  return `${prefix}_${cleaned}_${Date.now()}`;
}

export class FakeMetrcAdapter implements MetrcAdapter {
  async healthCheck() {
    return {
      adapter: "fake" as const,
      ok: true,
      checkedAt: nowIso(),
      message: "Fake Metrc adapter is available. No real Metrc calls are made."
    };
  }

  async getFacilities() {
    return fakeFacilities;
  }

  async getItems(_context: MetrcAdapterContext) {
    void _context;

    return fakeItems;
  }

  async getPackages(
    _context: MetrcAdapterContext,
    filters: MetrcPackageFilters = {}
  ): Promise<MetrcPaginatedResult<MetrcPackage>> {
    void _context;

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 25;
    const filtered = filters.status
      ? fakePackages.filter((pkg) => pkg.status === filters.status)
      : fakePackages;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      page,
      pageSize,
      total: filtered.length,
      hasMore: start + pageSize < filtered.length
    };
  }

  async getPackageByLabel(_context: MetrcAdapterContext, label: string) {
    return fakePackages.find((pkg) => pkg.label === label) ?? null;
  }

  async adjustPackage(
    _context: MetrcAdapterContext,
    input: MetrcPackageAdjustmentInput
  ): Promise<MetrcPackageAdjustmentResult> {
    return {
      metrcAdjustmentId: fakeId("fake_adjustment", input.packageLabel),
      packageLabel: input.packageLabel,
      acceptedAt: nowIso()
    };
  }

  async createSalesReceipt(
    _context: MetrcAdapterContext,
    input: MetrcSalesReceiptInput
  ): Promise<MetrcSalesReceiptResult> {
    return {
      metrcReceiptId: fakeId("fake_receipt", input.externalReceiptNumber),
      externalReceiptNumber: input.externalReceiptNumber,
      acceptedAt: nowIso()
    };
  }

  async voidSalesReceipt(_context: MetrcAdapterContext, _metrcReceiptId: string) {
    void _context;
    void _metrcReceiptId;

    return undefined;
  }
}
