import Link from "next/link";
import { Prisma, ProductCategory, ProductStatus } from "@prisma/client";
import { PagePanel } from "@/components/ui/page-panel";
import { getCurrentUser } from "@/server/auth/current-user";
import { hasPermission } from "@/server/auth/permissions";
import { formatCents } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";
import { archiveProduct, createProduct, updateProduct } from "./actions";

export const dynamic = "force-dynamic";

const productCategories = Object.values(ProductCategory);
const productStatuses = Object.values(ProductStatus);

type ProductsPageProps = {
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const canWriteCatalog = hasPermission(user, "catalog:write");
  const query = getParam(params, "q");
  const categoryParam = getParam(params, "category");
  const statusParam = getParam(params, "status");
  const category = productCategories.includes(categoryParam as ProductCategory) ? (categoryParam as ProductCategory) : "";
  const status = productStatuses.includes(statusParam as ProductStatus) ? (statusParam as ProductStatus) : "";
  const where: Prisma.ProductWhereInput = {
    AND: [
      query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { sku: { contains: query, mode: "insensitive" } }
            ]
          }
        : {},
      category ? { category } : {},
      status ? { status } : {}
    ]
  };
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
  });

  return (
    <div className="space-y-6">
      <PagePanel title="Product catalog" description="Manage sellable product records used by inventory packages.">
        {canWriteCatalog ? (
          <form action={createProduct} className="grid gap-3 md:grid-cols-6">
            <label className="md:col-span-2">
              <RequiredLabel>Name</RequiredLabel>
              <input name="name" required minLength={2} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" />
              <span className="mt-1 block text-xs text-ink/50">Use the product name operators see on packages.</span>
            </label>
            <label>
              <RequiredLabel>Category</RequiredLabel>
              <select name="category" required className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
                {productCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <RequiredLabel>SKU</RequiredLabel>
              <input name="sku" required minLength={2} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" />
              <span className="mt-1 block text-xs text-ink/50">SKU must be unique.</span>
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
              <RequiredLabel>Default price</RequiredLabel>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0.00"
                required
                className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
              />
            </label>
            <div className="md:col-span-6">
              <button className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Create product</button>
            </div>
          </form>
        ) : (
          <EmptyState message={`Role ${user.role} can view products but cannot create or edit catalog records.`} />
        )}
      </PagePanel>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-5">
          <label className="md:col-span-2">
            <span className="text-xs font-medium uppercase text-ink/60">Search</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Name or SKU"
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
              {productStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">Filter</button>
            <Link href="/products" className="rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold text-ink">
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Products</h2>
        </div>
        <div className="divide-y divide-ink/10">
          {products.length === 0 ? (
            <div className="p-5">
              <EmptyState message="No products match the current filters." />
            </div>
          ) : null}
          {products.map((product) => (
            <div key={product.id} className="p-5">
              <div className="grid gap-3 md:grid-cols-6 md:items-center">
                <div className="md:col-span-2">
                  <p className="font-semibold text-ink">{product.name}</p>
                  <p className="text-sm text-ink/60">{product.sku}</p>
                </div>
                <p className="text-sm text-ink/70">{product.category}</p>
                <p className="text-sm text-ink/70">{product.unitOfMeasure}</p>
                <p className="text-sm text-ink/70">{formatCents(product.priceCents)}</p>
                <p className="text-sm font-medium text-ink">{product.status}</p>
              </div>

              {canWriteCatalog ? (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-moss">Edit</summary>
                  <form action={updateProduct} className="mt-3 grid gap-3 md:grid-cols-6">
                    <input type="hidden" name="productId" value={product.id} />
                    <label className="md:col-span-2">
                      <RequiredLabel>Name</RequiredLabel>
                      <input
                        name="name"
                        defaultValue={product.name}
                        required
                        minLength={2}
                        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                      />
                    </label>
                    <label>
                      <RequiredLabel>Category</RequiredLabel>
                      <select
                        name="category"
                        defaultValue={product.category}
                        required
                        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                      >
                        {productCategories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <RequiredLabel>SKU</RequiredLabel>
                      <input
                        name="sku"
                        defaultValue={product.sku}
                        required
                        minLength={2}
                        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                      />
                    </label>
                    <label>
                      <RequiredLabel>Unit</RequiredLabel>
                      <input
                        name="unitOfMeasure"
                        defaultValue={product.unitOfMeasure}
                        required
                        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                      />
                    </label>
                    <label>
                      <RequiredLabel>Default price</RequiredLabel>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={(product.priceCents / 100).toFixed(2)}
                        required
                        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                      />
                    </label>
                    <label>
                      <RequiredLabel>Status</RequiredLabel>
                      <select
                        name="status"
                        defaultValue={product.status}
                        required
                        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                      >
                        {productStatuses.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-end gap-2 md:col-span-5">
                      <button className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Save</button>
                    </div>
                  </form>
                  {product.status === ProductStatus.ACTIVE ? (
                    <form action={archiveProduct} className="mt-3">
                      <input type="hidden" name="productId" value={product.id} />
                      <button className="rounded-md border border-clay px-4 py-2 text-sm font-semibold text-clay">
                        Archive
                      </button>
                    </form>
                  ) : null}
                </details>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
