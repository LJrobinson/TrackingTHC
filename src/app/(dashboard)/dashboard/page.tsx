import Link from "next/link";
import { PackageStatus, ProductStatus, SyncJobStatus, SyncStatus } from "@prisma/client";
import { StatCard } from "@/components/ui/stat-card";
import { formatDateTime, formatQuantity, summarizeMetadata } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";
import { getMetrcAdapter } from "@/server/metrc/metrc.service";

export const dynamic = "force-dynamic";

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-md border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/60">{message}</p>;
}

export default async function DashboardPage() {
  const [
    metrcHealth,
    activeProducts,
    activePackages,
    packagesNeedingSync,
    failedSyncJobs,
    recentAdjustments,
    recentAuditEvents
  ] = await Promise.all([
    getMetrcAdapter().healthCheck(),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    prisma.inventoryPackage.count({ where: { status: PackageStatus.ACTIVE } }),
    prisma.inventoryPackage.count({
      where: {
        syncStatus: {
          in: [SyncStatus.NOT_SYNCED, SyncStatus.SYNC_PENDING, SyncStatus.SYNC_FAILED, SyncStatus.CONFLICT]
        }
      }
    }),
    prisma.metrcSyncJob.count({ where: { status: SyncJobStatus.FAILED } }),
    prisma.inventoryAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        actor: true,
        inventoryPackage: {
          include: { product: true }
        }
      }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { actor: true }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active products" value={String(activeProducts)} detail="Available product records" />
        <StatCard label="Active packages" value={String(activePackages)} detail="Open inventory packages" />
        <StatCard label="Packages needing sync" value={String(packagesNeedingSync)} detail="Pending, failed, conflict, or not synced" />
        <StatCard label="Failed sync jobs" value={String(failedSyncJobs)} detail="Fake Metrc jobs needing review" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Recent inventory adjustments</h2>
              <p className="mt-1 text-sm text-ink/60">Before, change, and after quantities at a glance.</p>
            </div>
            <Link href="/inventory" className="text-sm font-semibold text-moss">
              Inventory
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentAdjustments.length === 0 ? (
              <EmptyState message="No inventory adjustments have been recorded yet." />
            ) : (
              recentAdjustments.map((adjustment) => (
                <div key={adjustment.id} className="rounded-md border border-ink/10 p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/inventory/${adjustment.inventoryPackage.id}`} className="font-semibold text-moss">
                        {adjustment.inventoryPackage.label}
                      </Link>
                      <p className="mt-1 text-ink/60">
                        {adjustment.inventoryPackage.product.name} - {adjustment.reason}
                      </p>
                    </div>
                    <p className="text-xs text-ink/50">{formatDateTime(adjustment.createdAt)}</p>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <p className="rounded-md bg-cream px-3 py-2">
                      <span className="block text-xs uppercase text-ink/50">Before</span>
                      <span className="font-semibold text-ink">
                        {formatQuantity(adjustment.quantityBefore, adjustment.inventoryPackage.unitOfMeasure)}
                      </span>
                    </p>
                    <p className="rounded-md bg-cream px-3 py-2">
                      <span className="block text-xs uppercase text-ink/50">Change</span>
                      <span className="font-semibold text-moss">
                        {formatQuantity(adjustment.quantityDelta, adjustment.inventoryPackage.unitOfMeasure)}
                      </span>
                    </p>
                    <p className="rounded-md bg-cream px-3 py-2">
                      <span className="block text-xs uppercase text-ink/50">After</span>
                      <span className="font-semibold text-ink">
                        {formatQuantity(adjustment.quantityAfter, adjustment.inventoryPackage.unitOfMeasure)}
                      </span>
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-ink/50">Actor: {adjustment.actor?.name ?? "System"}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">What changed recently</h2>
              <p className="mt-1 text-sm text-ink/60">Latest audit activity without sensitive payloads.</p>
            </div>
            <Link href="/sync-status" className="text-sm font-semibold text-moss">
              Sync status
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentAuditEvents.length === 0 ? (
              <EmptyState message="No audit events have been recorded yet." />
            ) : (
              recentAuditEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-ink/10 p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{event.action}</p>
                      <p className="mt-1 text-ink/60">
                        {event.entityType} - {event.actor?.name ?? "System"}
                      </p>
                    </div>
                    <p className="text-xs text-ink/50">{formatDateTime(event.createdAt)}</p>
                  </div>
                  <p className="mt-3 text-xs text-ink/60">{summarizeMetadata(event.metadata)}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Adapter</h2>
        <p className="mt-2 text-sm text-ink/65">
          {metrcHealth.adapter} - {metrcHealth.message}
        </p>
      </section>
    </div>
  );
}
