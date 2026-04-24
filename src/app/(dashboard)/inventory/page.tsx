import Link from "next/link";
import { PackageStatus, ProductStatus } from "@prisma/client";
import { PagePanel } from "@/components/ui/page-panel";
import { formatDate, formatDecimal } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";
import { adjustPackageQuantity, archivePackage, createPackage, updatePackage } from "./actions";

export const dynamic = "force-dynamic";

const packageStatuses = Object.values(PackageStatus);

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-md border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/60">{message}</p>;
}

function dateInputValue(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? "";
}

export default async function InventoryPage() {
  const [products, packages] = await Promise.all([
    prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      orderBy: { name: "asc" }
    }),
    prisma.inventoryPackage.findMany({
      include: { product: true },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
    })
  ]);

  return (
    <div className="space-y-6">
      <PagePanel title="Inventory packages" description="Create packages, maintain package metadata, and record quantity adjustments.">
        <form action={createPackage} className="grid gap-3 md:grid-cols-6">
          <label className="md:col-span-2">
            <span className="text-xs font-medium uppercase text-ink/60">Package label</span>
            <input name="label" required className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" />
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-medium uppercase text-ink/60">Product</span>
            <select name="productId" required className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
              {products.length === 0 ? <option value="">Create an active product first</option> : null}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Quantity</span>
            <input
              name="quantity"
              type="number"
              min="0"
              step="0.001"
              required
              className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Unit</span>
            <input
              name="unitOfMeasure"
              defaultValue="each"
              required
              className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Status</span>
            <select name="status" defaultValue={PackageStatus.ACTIVE} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
              {packageStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Source</span>
            <input
              name="source"
              defaultValue="manual"
              className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Received</span>
            <input name="receivedAt" type="date" className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Expiration</span>
            <input name="expiresAt" type="date" className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-6">
            <button
              disabled={products.length === 0}
              className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/30"
            >
              Create package
            </button>
          </div>
        </form>
        {products.length === 0 ? <div className="mt-4"><EmptyState message="No active products are available for package creation." /></div> : null}
      </PagePanel>

      <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Packages</h2>
        </div>
        <div className="divide-y divide-ink/10">
          {packages.length === 0 ? (
            <div className="p-5">
              <EmptyState message="No inventory packages have been created yet." />
            </div>
          ) : null}
          {packages.map((inventoryPackage) => (
            <div key={inventoryPackage.id} className="p-5">
              <div className="grid gap-3 md:grid-cols-7 md:items-center">
                <div className="md:col-span-2">
                  <Link href={`/inventory/${inventoryPackage.id}`} className="font-semibold text-moss">
                    {inventoryPackage.label}
                  </Link>
                  <p className="text-sm text-ink/60">{inventoryPackage.product.name}</p>
                </div>
                <p className="text-sm text-ink/70">
                  {formatDecimal(inventoryPackage.quantity)} {inventoryPackage.unitOfMeasure}
                </p>
                <p className="text-sm text-ink/70">{inventoryPackage.status}</p>
                <p className="text-sm text-ink/70">{inventoryPackage.source}</p>
                <p className="text-sm text-ink/70">{inventoryPackage.syncStatus}</p>
                <p className="text-sm text-ink/70">{formatDate(inventoryPackage.receivedAt)}</p>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-moss">Edit</summary>
                <form action={updatePackage} className="mt-3 grid gap-3 md:grid-cols-6">
                  <input type="hidden" name="packageId" value={inventoryPackage.id} />
                  <label className="md:col-span-2">
                    <span className="text-xs font-medium uppercase text-ink/60">Package label</span>
                    <input
                      name="label"
                      defaultValue={inventoryPackage.label}
                      required
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="md:col-span-2">
                    <span className="text-xs font-medium uppercase text-ink/60">Product</span>
                    <select
                      name="productId"
                      defaultValue={inventoryPackage.productId}
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-xs font-medium uppercase text-ink/60">Unit</span>
                    <input
                      name="unitOfMeasure"
                      defaultValue={inventoryPackage.unitOfMeasure}
                      required
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-medium uppercase text-ink/60">Status</span>
                    <select
                      name="status"
                      defaultValue={inventoryPackage.status}
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    >
                      {packageStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-xs font-medium uppercase text-ink/60">Source</span>
                    <input
                      name="source"
                      defaultValue={inventoryPackage.source}
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-medium uppercase text-ink/60">Received</span>
                    <input
                      name="receivedAt"
                      type="date"
                      defaultValue={dateInputValue(inventoryPackage.receivedAt)}
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-medium uppercase text-ink/60">Expiration</span>
                    <input
                      name="expiresAt"
                      type="date"
                      defaultValue={dateInputValue(inventoryPackage.expiresAt)}
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="flex items-end gap-2">
                    <button className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Save</button>
                  </div>
                </form>
                {inventoryPackage.status !== PackageStatus.FINISHED ? (
                  <form action={archivePackage} className="mt-3">
                    <input type="hidden" name="packageId" value={inventoryPackage.id} />
                    <button className="rounded-md border border-clay px-4 py-2 text-sm font-semibold text-clay">
                      Close package
                    </button>
                  </form>
                ) : null}
              </details>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-moss">Adjust quantity</summary>
                <form action={adjustPackageQuantity} className="mt-3 grid gap-3 md:grid-cols-5">
                  <input type="hidden" name="packageId" value={inventoryPackage.id} />
                  <label>
                    <span className="text-xs font-medium uppercase text-ink/60">Change</span>
                    <input
                      name="quantityDelta"
                      type="number"
                      step="0.001"
                      required
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="md:col-span-3">
                    <span className="text-xs font-medium uppercase text-ink/60">Reason</span>
                    <input name="reason" required className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" />
                  </label>
                  <div className="flex items-end">
                    <button className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Record</button>
                  </div>
                </form>
              </details>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
