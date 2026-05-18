import Link from "next/link";
import { notFound } from "next/navigation";
import { PagePanel } from "@/components/ui/page-panel";
import { getCurrentUser } from "@/server/auth/current-user";
import { hasPermission } from "@/server/auth/permissions";
import { formatDate, formatDateTime, formatQuantity, summarizeMetadata } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";
import { adjustPackageQuantity } from "../actions";

export const dynamic = "force-dynamic";

type PackageDetailPageProps = {
  params: Promise<{ id: string }>;
};

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-md border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/60">{message}</p>;
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-ink/10 bg-cream p-4">
      <p className="text-xs font-medium uppercase text-ink/60">{label}</p>
      <div className="mt-2 font-semibold text-ink">{value}</div>
    </div>
  );
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const canWriteInventory = hasPermission(user, "inventory:write");
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
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="space-y-6">
      <Link href="/inventory" className="text-sm font-semibold text-moss">
        Back to inventory
      </Link>

      <PagePanel title={inventoryPackage.label} description="Package detail, adjustment history, audit trail, and fake sync jobs.">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <DetailItem label="Package label" value={inventoryPackage.label} />
          <DetailItem label="Product" value={inventoryPackage.product.name} />
          <DetailItem label="Category" value={inventoryPackage.product.category} />
          <DetailItem
            label="Current quantity"
            value={<span className="text-2xl">{formatQuantity(inventoryPackage.quantity, inventoryPackage.unitOfMeasure)}</span>}
          />
          <DetailItem label="Package status" value={inventoryPackage.status} />
          <DetailItem label="Sync status" value={inventoryPackage.syncStatus} />
          <DetailItem label="Source" value={inventoryPackage.source} />
          <DetailItem label="Received" value={formatDate(inventoryPackage.receivedAt)} />
          <DetailItem label="Expiration" value={formatDate(inventoryPackage.expiresAt)} />
          <DetailItem label="Last synced" value={formatDateTime(inventoryPackage.lastSyncedAt)} />
        </div>

        {canWriteInventory ? (
          <form action={adjustPackageQuantity} className="mt-6 grid gap-3 md:grid-cols-5">
            <input type="hidden" name="packageId" value={inventoryPackage.id} />
            <label>
              <span className="text-xs font-medium uppercase text-ink/60">
                Adjustment amount <span className="text-clay">Required</span>
              </span>
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
              <span className="text-xs font-medium uppercase text-ink/60">
                Reason <span className="text-clay">Required</span>
              </span>
              <input
                name="reason"
                required
                minLength={3}
                className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Record adjustment</button>
            </div>
          </form>
        ) : (
          <div className="mt-6">
            <EmptyState message={`Role ${user.role} can view package history but cannot record adjustments.`} />
          </div>
        )}
      </PagePanel>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Adjustment history</h2>
        <div className="mt-4 space-y-3">
          {inventoryPackage.inventoryAdjustments.length === 0 ? (
            <EmptyState message="No adjustments have been recorded for this package." />
          ) : (
            inventoryPackage.inventoryAdjustments.map((adjustment) => (
              <div key={adjustment.id} className="rounded-md border border-ink/10 p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{adjustment.reason}</p>
                    <p className="mt-1 text-ink/60">
                      {formatDateTime(adjustment.createdAt)} - {adjustment.type} - {adjustment.actor?.name ?? "System"}
                    </p>
                  </div>
                  <p className="font-medium text-ink">{adjustment.syncStatus}</p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-md bg-cream p-3">
                    <p className="text-xs font-medium uppercase text-ink/50">Before</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {formatQuantity(adjustment.quantityBefore, inventoryPackage.unitOfMeasure)}
                    </p>
                  </div>
                  <div className="rounded-md bg-cream p-3">
                    <p className="text-xs font-medium uppercase text-ink/50">Adjustment</p>
                    <p className="mt-1 text-lg font-semibold text-moss">
                      {formatQuantity(adjustment.quantityDelta, inventoryPackage.unitOfMeasure)}
                    </p>
                  </div>
                  <div className="rounded-md bg-cream p-3">
                    <p className="text-xs font-medium uppercase text-ink/50">After</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {formatQuantity(adjustment.quantityAfter, inventoryPackage.unitOfMeasure)}
                    </p>
                  </div>
                </div>
                {adjustment.notes ? <p className="mt-3 text-ink/60">Notes: {adjustment.notes}</p> : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Fake Metrc sync history</h2>
        <div className="mt-4 space-y-3">
          {syncJobs.length === 0 ? (
            <EmptyState message="No fake Metrc sync jobs are linked to this package." />
          ) : (
            syncJobs.map((job) => (
              <div key={job.id} className="grid gap-2 rounded-md border border-ink/10 p-4 text-sm md:grid-cols-6">
                <div>
                  <p className="text-xs uppercase text-ink/50">Status</p>
                  <p className="mt-1 font-semibold text-ink">{job.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Type</p>
                  <p className="mt-1 text-ink/70">{job.type}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Created</p>
                  <p className="mt-1 text-ink/70">{formatDateTime(job.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Completed</p>
                  <p className="mt-1 text-ink/70">{formatDateTime(job.completedAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Retries</p>
                  <p className="mt-1 text-ink/70">{job.attempts}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Error</p>
                  <p className="mt-1 text-clay">{job.lastError ?? "None"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Audit trail</h2>
        <div className="mt-4 space-y-3">
          {auditEvents.length === 0 ? (
            <EmptyState message="No audit events are linked to this package yet." />
          ) : (
            auditEvents.map((event) => (
              <div key={event.id} className="grid gap-2 rounded-md border border-ink/10 p-4 text-sm md:grid-cols-5">
                <div>
                  <p className="text-xs uppercase text-ink/50">Action</p>
                  <p className="mt-1 font-semibold text-ink">{event.action}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Entity</p>
                  <p className="mt-1 text-ink/70">{event.entityType}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Timestamp</p>
                  <p className="mt-1 text-ink/70">{formatDateTime(event.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Actor</p>
                  <p className="mt-1 text-ink/70">{event.actor?.name ?? "System"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Metadata</p>
                  <p className="mt-1 text-ink/70">{summarizeMetadata(event.metadata)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
