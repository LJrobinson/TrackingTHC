import Link from "next/link";
import { PackageStatus, Prisma, ProductCategory, ProductStatus, SyncStatus } from "@prisma/client";
import { PagePanel } from "@/components/ui/page-panel";
import { getCurrentUser } from "@/server/auth/current-user";
import { hasPermission } from "@/server/auth/permissions";
import { formatDate, formatDecimal } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";
import { adjustPackageQuantity, archivePackage, createPackage, updatePackage } from "./actions";

export const dynamic = "force-dynamic";

const packageStatuses = Object.values(PackageStatus);
const productCategories = Object.values(ProductCategory);
const syncStatuses = Object.values(SyncStatus);

type InventoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-md border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/60">{message}</p>;
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase text-ink/60">
      {children} <span className="text-clay">Required</span>
    </span>
  );
}

function dateInputValue(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? "";
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const canWriteInventory = hasPermission(user, "inventory:write");
  const query = getParam(params, "q");
  const categoryParam = getParam(params, "category");
  const statusParam = getParam(params, "status");
  const syncStatusParam = getParam(params, "syncStatus");
  const category = productCategories.includes(categoryParam as ProductCategory) ? (categoryParam as ProductCategory) : "";
  const status = packageStatuses.includes(statusParam as PackageStatus) ? (statusParam as PackageStatus) : "";
  const syncStatus = syncStatuses.includes(syncStatusParam as SyncStatus) ? (syncStatusParam as SyncStatus) : "";
  const where: Prisma.InventoryPackageWhereInput = {
    AND: [
      query
        ? {
            OR: [
              { label: { contains: query, mode: "insensitive" } },
              { product: { name: { contains: query, mode: "insensitive" } } }
            ]
          }
        : {},
      category ? { product: { category } } : {},
      status ? { status } : {},
      syncStatus ? { syncStatus } : {}
    ]
  };
  const [products, packages] = await Promise.all([
    prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      orderBy: { name: "asc" }
    }),
    prisma.inventoryPackage.findMany({
      where,
      include: { product: true },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
    })
  ]);

  return (
    <div className="space-y-6">
      <PagePanel title="Inventory packages" description="Create packages, maintain package metadata, and record quantity adjustments.">
        {canWriteInventory ? (
          <form action={createPackage} className="grid gap-3 md:grid-cols-6">
            <label className="md:col-span-2">
              <RequiredLabel>Package label</RequiredLabel>
              <input name="label" required minLength={3} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" />
              <span className="mt-1 block text-xs text-ink/50">Label must be unique for the current facility.</span>
            </label>
            <label className="md:col-span-2">
              <RequiredLabel>Product</RequiredLabel>
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
              <RequiredLabel>Quantity</RequiredLabel>
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
              <RequiredLabel>Unit</RequiredLabel>
              <input
                name="unitOfMeasure"
                defaultValue="each"
                required
                className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
              />
            </label>
            <label>
              <RequiredLabel>Status</RequiredLabel>
              <select name="status" defaultValue={PackageStatus.ACTIVE} required className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
                {packageStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
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
        ) : (
          <EmptyState message={`Role ${user.role} can view inventory but cannot change package records.`} />
        )}
        {products.length === 0 ? (
          <div className="mt-4">
            <EmptyState message="No active products are available for package creation." />
          </div>
        ) : null}
      </PagePanel>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-6">
          <label className="md:col-span-2">
            <span className="text-xs font-medium uppercase text-ink/60">Search</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Label or product"
              className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Category</span>
            <select name="category" defaultValue={category} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
              <option value="">All categories</option>
              {productCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Status</span>
            <select name="status" defaultValue={status} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
              <option value="">All statuses</option>
              {packageStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Sync</span>
            <select name="syncStatus" defaultValue={syncStatus} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
              <option value="">All sync states</option>
              {syncStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">Filter</button>
            <Link href="/inventory" className="rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold text-ink">
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Packages</h2>
        </div>
        <div className="divide-y divide-ink/10">
          {packages.length === 0 ? (
            <div className="p-5">
              <EmptyState message="No inventory packages match the current filters." />
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

              {canWriteInventory ? (
                <>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-moss">Edit</summary>
                    <form action={updatePackage} className="mt-3 grid gap-3 md:grid-cols-6">
                      <input type="hidden" name="packageId" value={inventoryPackage.id} />
                      <label className="md:col-span-2">
                        <RequiredLabel>Package label</RequiredLabel>
                        <input
                          name="label"
                          defaultValue={inventoryPackage.label}
                          required
                          minLength={3}
                          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="md:col-span-2">
                        <RequiredLabel>Product</RequiredLabel>
                        <select
                          name="productId"
                          defaultValue={inventoryPackage.productId}
                          required
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
                        <RequiredLabel>Unit</RequiredLabel>
                        <input
                          name="unitOfMeasure"
                          defaultValue={inventoryPackage.unitOfMeasure}
                          required
                          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                        />
                      </label>
                      <label>
                        <RequiredLabel>Status</RequiredLabel>
                        <select
                          name="status"
                          defaultValue={inventoryPackage.status}
                          required
                          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                        >
                          {packageStatuses.map((item) => (
                            <option key={item} value={item}>
                              {item}
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
                        <RequiredLabel>Change</RequiredLabel>
                        <input
                          name="quantityDelta"
                          type="number"
                          step="0.001"
                          required
                          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                        />
                        <span className="mt-1 block text-xs text-ink/50">Use a negative value to reduce inventory.</span>
                      </label>
                      <label className="md:col-span-3">
                        <RequiredLabel>Reason</RequiredLabel>
                        <input
                          name="reason"
                          required
                          minLength={3}
                          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                        />
                      </label>
                      <div className="flex items-end">
                        <button className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Record</button>
                      </div>
                    </form>
                  </details>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
