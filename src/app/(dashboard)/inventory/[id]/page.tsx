import Link from "next/link";
import { notFound } from "next/navigation";
import { PagePanel } from "@/components/ui/page-panel";
import { formatDate, formatDateTime, formatDecimal } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";
import { adjustPackageQuantity } from "../actions";

export const dynamic = "force-dynamic";

type PackageDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = await params;
  const inventoryPackage = await prisma.inventoryPackage.findUnique({
    where: { id },
    include: {
      product: true,
      inventoryAdjustments: {
        orderBy: { createdAt: "desc" },
        include: { actor: true }
      }
    }
  });

  if (!inventoryPackage) {
    notFound();
  }

  const syncJobs = await prisma.metrcSyncJob.findMany({
    where: {
      targetEntityType: "InventoryPackage",
      targetEntityId: inventoryPackage.id
    },
    orderBy: { createdAt: "desc" }
  });

  const adjustmentIds = inventoryPackage.inventoryAdjustments.map((adjustment) => adjustment.id);
  const syncJobIds = syncJobs.map((job) => job.id);
  const auditEvents = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "InventoryPackage", entityId: inventoryPackage.id },
        { entityType: "InventoryAdjustment", entityId: { in: adjustmentIds } },
        { entityType: "MetrcSyncJob", entityId: { in: syncJobIds } }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="space-y-6">
      <Link href="/inventory" className="text-sm font-semibold text-moss">
        Back to inventory
      </Link>

      <PagePanel title={inventoryPackage.label} description="Package detail, adjustment history, audit trail, and fake sync jobs.">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-md border border-ink/10 bg-cream p-4">
            <p className="text-xs font-medium uppercase text-ink/60">Current quantity</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {formatDecimal(inventoryPackage.quantity)} {inventoryPackage.unitOfMeasure}
            </p>
          </div>
          <div className="rounded-md border border-ink/10 bg-cream p-4">
            <p className="text-xs font-medium uppercase text-ink/60">Product</p>
            <p className="mt-2 font-semibold text-ink">{inventoryPackage.product.name}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-cream p-4">
            <p className="text-xs font-medium uppercase text-ink/60">Sync status</p>
            <p className="mt-2 font-semibold text-ink">{inventoryPackage.syncStatus}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-cream p-4">
            <p className="text-xs font-medium uppercase text-ink/60">Expiration</p>
            <p className="mt-2 font-semibold text-ink">{formatDate(inventoryPackage.expiresAt)}</p>
          </div>
        </div>

        <form action={adjustPackageQuantity} className="mt-6 grid gap-3 md:grid-cols-5">
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
      </PagePanel>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Adjustments</h2>
        <div className="mt-4 divide-y divide-ink/10">
          {inventoryPackage.inventoryAdjustments.map((adjustment) => (
            <div key={adjustment.id} className="grid gap-2 py-3 text-sm md:grid-cols-6">
              <p className="font-medium text-ink">{formatDateTime(adjustment.createdAt)}</p>
              <p className="text-ink/70">{adjustment.reason}</p>
              <p className="text-ink/70">{formatDecimal(adjustment.quantityDelta)}</p>
              <p className="text-ink/70">{formatDecimal(adjustment.quantityBefore)}</p>
              <p className="text-ink/70">{formatDecimal(adjustment.quantityAfter)}</p>
              <p className="text-ink/70">{adjustment.syncStatus}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Fake Metrc sync jobs</h2>
        <div className="mt-4 divide-y divide-ink/10">
          {syncJobs.map((job) => (
            <div key={job.id} className="grid gap-2 py-3 text-sm md:grid-cols-6">
              <p className="font-medium text-ink">{job.type}</p>
              <p className="text-ink/70">{job.status}</p>
              <p className="text-ink/70">{job.syncStatus}</p>
              <p className="text-ink/70">{job.attempts}</p>
              <p className="text-ink/70">{formatDateTime(job.createdAt)}</p>
              <p className="text-clay">{job.lastError}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Audit events</h2>
        <div className="mt-4 divide-y divide-ink/10">
          {auditEvents.map((event) => (
            <div key={event.id} className="grid gap-2 py-3 text-sm md:grid-cols-4">
              <p className="font-medium text-ink">{event.action}</p>
              <p className="text-ink/70">{event.entityType}</p>
              <p className="text-ink/70">{formatDateTime(event.createdAt)}</p>
              <p className="font-mono text-xs text-ink/50">{event.entityId}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
