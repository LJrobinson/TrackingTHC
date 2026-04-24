import Link from "next/link";
import { PackageStatus, ProductStatus, SyncJobStatus } from "@prisma/client";
import { StatCard } from "@/components/ui/stat-card";
import { formatDateTime, formatDecimal } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";
import { getMetrcAdapter } from "@/server/metrc/metrc.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrcHealth, activeProducts, activePackages, pendingSyncJobs, failedSyncJobs, recentAdjustments, recentAuditEvents] =
    await Promise.all([
      getMetrcAdapter().healthCheck(),
      prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      prisma.inventoryPackage.count({ where: { status: PackageStatus.ACTIVE } }),
      prisma.metrcSyncJob.count({ where: { status: SyncJobStatus.PENDING } }),
      prisma.metrcSyncJob.count({ where: { status: SyncJobStatus.FAILED } }),
      prisma.inventoryAdjustment.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          inventoryPackage: {
            include: { product: true }
          }
        }
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5
      })
    ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active products" value={String(activeProducts)} detail="Available product records" />
        <StatCard label="Active packages" value={String(activePackages)} detail="Open inventory packages" />
        <StatCard label="Pending sync jobs" value={String(pendingSyncJobs)} detail="Fake Metrc jobs waiting" />
        <StatCard label="Failed sync jobs" value={String(failedSyncJobs)} detail="Fake Metrc jobs needing review" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">Recent adjustments</h2>
            <Link href="/inventory" className="text-sm font-semibold text-moss">
              Inventory
            </Link>
          </div>
          <div className="mt-4 divide-y divide-ink/10">
            {recentAdjustments.map((adjustment) => (
              <div key={adjustment.id} className="py-3 text-sm">
                <p className="font-medium text-ink">{adjustment.inventoryPackage.label}</p>
                <p className="mt-1 text-ink/60">
                  {adjustment.inventoryPackage.product.name} - {formatDecimal(adjustment.quantityDelta)} -{" "}
                  {adjustment.reason}
                </p>
                <p className="mt-1 text-xs text-ink/45">{formatDateTime(adjustment.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">Recent audit events</h2>
            <Link href="/sync-status" className="text-sm font-semibold text-moss">
              Sync status
            </Link>
          </div>
          <div className="mt-4 divide-y divide-ink/10">
            {recentAuditEvents.map((event) => (
              <div key={event.id} className="py-3 text-sm">
                <p className="font-medium text-ink">{event.action}</p>
                <p className="mt-1 text-ink/60">
                  {event.entityType} - {event.entityId ?? "No entity"}
                </p>
                <p className="mt-1 text-xs text-ink/45">{formatDateTime(event.createdAt)}</p>
              </div>
            ))}
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
