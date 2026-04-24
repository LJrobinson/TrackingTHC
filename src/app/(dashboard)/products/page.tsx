import { ProductCategory, ProductStatus } from "@prisma/client";
import { PagePanel } from "@/components/ui/page-panel";
import { formatCents } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";
import { archiveProduct, createProduct, updateProduct } from "./actions";

export const dynamic = "force-dynamic";

const productCategories = Object.values(ProductCategory);
const productStatuses = Object.values(ProductStatus);

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
  });

  return (
    <div className="space-y-6">
      <PagePanel title="Product catalog" description="Manage sellable product records used by inventory packages.">
        <form action={createProduct} className="grid gap-3 md:grid-cols-6">
          <label className="md:col-span-2">
            <span className="text-xs font-medium uppercase text-ink/60">Name</span>
            <input name="name" required className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Category</span>
            <select name="category" className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">SKU</span>
            <input name="sku" required className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" />
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
            <span className="text-xs font-medium uppercase text-ink/60">Default price</span>
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
      </PagePanel>

      <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Products</h2>
        </div>
        <div className="divide-y divide-ink/10">
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

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-moss">Edit</summary>
                <form action={updateProduct} className="mt-3 grid gap-3 md:grid-cols-6">
                  <input type="hidden" name="productId" value={product.id} />
                  <label className="md:col-span-2">
                    <span className="text-xs font-medium uppercase text-ink/60">Name</span>
                    <input
                      name="name"
                      defaultValue={product.name}
                      required
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-medium uppercase text-ink/60">Category</span>
                    <select
                      name="category"
                      defaultValue={product.category}
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    >
                      {productCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-xs font-medium uppercase text-ink/60">SKU</span>
                    <input
                      name="sku"
                      defaultValue={product.sku}
                      required
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-medium uppercase text-ink/60">Unit</span>
                    <input
                      name="unitOfMeasure"
                      defaultValue={product.unitOfMeasure}
                      required
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-medium uppercase text-ink/60">Default price</span>
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
                    <span className="text-xs font-medium uppercase text-ink/60">Status</span>
                    <select
                      name="status"
                      defaultValue={product.status}
                      className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                    >
                      {productStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
