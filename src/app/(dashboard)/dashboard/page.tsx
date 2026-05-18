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

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-semibold text-moss">
      {children}
    </Link>
  );
}

export default async function DashboardPage() {
  const [
    metrcHealth,
    activeProducts,
    activePackages,
    packagesNeedingSync,
    pendingSyncJobs,
    failedSyncJobs,
    conflictPackages,
    lowStockPackages,
    attentionPackages,
    recentAdjustments,
    recentAuditEvents,
    recentSyncJobs
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
    prisma.metrcSyncJob.count({ where: { status: SyncJobStatus.PENDING } }),
    prisma.metrcSyncJob.count({ where: { status: SyncJobStatus.FAILED } }),
    prisma.inventoryPackage.count({ where: { syncStatus: SyncStatus.CONFLICT } }),
    prisma.inventoryPackage.findMany({
      where: {
        status: PackageStatus.ACTIVE,
        quantity: { lte: "10" }
      },
      include: { product: true },
      orderBy: { quantity: "asc" },
      take: 5
    }),
    prisma.inventoryPackage.findMany({
      where: {
        OR: [
          { syncStatus: { in: [SyncStatus.SYNC_FAILED, SyncStatus.CONFLICT, SyncStatus.NOT_SYNCED] } },
          { quantity: { lte: "10" }, status: PackageStatus.ACTIVE }
        ]
      },
      include: { product: true },
      orderBy: [{ syncStatus: "asc" }, { quantity: "asc" }],
      take: 6
    }),
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
    }),
    prisma.metrcSyncJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active products" value={String(activeProducts)} detail="Catalog items available for packages" />
        <StatCard label="Active packages" value={String(activePackages)} detail="Open inventory packages on hand" />
        <StatCard label="Packages needing sync" value={String(packagesNeedingSync)} detail="Pending, failed, conflict, or not synced" />
        <StatCard label="Failed sync jobs" value={String(failedSyncJobs)} detail="Fake Metrc jobs needing review" />
      </div>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Operational Shortcuts</h2>
            <p className="mt-1 text-sm text-ink/60">Primary demo paths for reviewing the core loop.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/products" className="rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold text-ink">
              Products
            </Link>
            <Link href="/inventory" className="rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold text-ink">
              Inventory
            </Link>
            <Link href="/sync-status" className="rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold text-ink">
              Sync Status
            </Link>
            <Link href="/audit" className="rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold text-ink">
              Audit
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Sync health</h2>
              <p className="mt-1 text-sm text-ink/60">{metrcHealth.adapter} adapter is active.</p>
            </div>
            <SectionLink href="/sync-status">Review</SectionLink>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-md bg-cream p-4">
              <p className="text-xs uppercase text-ink/50">Pending jobs</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{pendingSyncJobs}</p>
            </div>
            <div className="rounded-md bg-cream p-4">
              <p className="text-xs uppercase text-ink/50">Failed jobs</p>
              <p className="mt-1 text-2xl font-semibold text-clay">{failedSyncJobs}</p>
            </div>
            <div className="rounded-md bg-cream p-4">
              <p className="text-xs uppercase text-ink/50">Package conflicts</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{conflictPackages}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink/60">{metrcHealth.message}</p>
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Needs attention</h2>
              <p className="mt-1 text-sm text-ink/60">Low stock, failed sync, conflict, or not-synced packages.</p>
            </div>
            <SectionLink href="/inventory">Inventory</SectionLink>
          </div>
          <div className="mt-4 divide-y divide-ink/10">
            {attentionPackages.length === 0 ? (
              <EmptyState message="No packages currently need attention." />
            ) : (
              attentionPackages.map((inventoryPackage) => (
                <div key={inventoryPackage.id} className="grid gap-2 py-3 text-sm md:grid-cols-5">
                  <Link href={`/inventory/${inventoryPackage.id}`} className="font-semibold text-moss">
                    {inventoryPackage.label}
                  </Link>
                  <p className="text-ink/70">{inventoryPackage.product.name}</p>
                  <p className="text-ink/70">{formatQuantity(inventoryPackage.quantity, inventoryPackage.unitOfMeasure)}</p>
                  <p className="text-ink/70">{inventoryPackage.status}</p>
                  <p className="font-medium text-ink">{inventoryPackage.syncStatus}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Recent inventory adjustments</h2>
              <p className="mt-1 text-sm text-ink/60">Before, change, and after quantities at a glance.</p>
            </div>
            <SectionLink href="/inventory">Inventory</SectionLink>
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
            <SectionLink href="/audit">Audit</SectionLink>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">Low-stock packages</h2>
            <SectionLink href="/inventory?syncStatus=SYNC_FAILED">Failed Sync</SectionLink>
          </div>
          <div className="mt-4 divide-y divide-ink/10">
            {lowStockPackages.length === 0 ? (
              <EmptyState message="No active packages are below the demo low-stock threshold." />
            ) : (
              lowStockPackages.map((inventoryPackage) => (
                <div key={inventoryPackage.id} className="grid gap-2 py-3 text-sm md:grid-cols-4">
                  <Link href={`/inventory/${inventoryPackage.id}`} className="font-semibold text-moss">
                    {inventoryPackage.label}
                  </Link>
                  <p className="text-ink/70">{inventoryPackage.product.name}</p>
                  <p className="font-medium text-clay">
                    {formatQuantity(inventoryPackage.quantity, inventoryPackage.unitOfMeasure)}
                  </p>
                  <p className="text-ink/70">{inventoryPackage.syncStatus}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">Recent sync jobs</h2>
            <SectionLink href="/sync-status">Queue</SectionLink>
          </div>
          <div className="mt-4 divide-y divide-ink/10">
            {recentSyncJobs.length === 0 ? (
              <EmptyState message="No fake Metrc sync jobs have been created yet." />
            ) : (
              recentSyncJobs.map((job) => (
                <div key={job.id} className="grid gap-2 py-3 text-sm md:grid-cols-4">
                  <p className="font-semibold text-ink">{job.status}</p>
                  <p className="text-ink/70">{job.type}</p>
                  <p className="text-ink/70">{formatDateTime(job.createdAt)}</p>
                  <p className="text-clay">{job.lastError ?? "No error"}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
