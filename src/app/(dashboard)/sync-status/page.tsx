import Link from "next/link";
import { SyncJobStatus } from "@prisma/client";
import { StatCard } from "@/components/ui/stat-card";
import { formatDateTime } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";
import { processPendingSyncJobs } from "./actions";

export const dynamic = "force-dynamic";

const jobStatuses = Object.values(SyncJobStatus);

export default async function SyncStatusPage() {
  const [jobs, counts] = await Promise.all([
    prisma.metrcSyncJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    Promise.all(
      jobStatuses.map(async (status) => ({
        status,
        count: await prisma.metrcSyncJob.count({ where: { status } })
      }))
    )
  ]);

  const packageIds = jobs
    .filter((job) => job.targetEntityType === "InventoryPackage" && job.targetEntityId)
    .map((job) => job.targetEntityId as string);
  const relatedPackages = await prisma.inventoryPackage.findMany({
    where: { id: { in: packageIds } },
    include: { product: true }
  });
  const packageById = new Map(relatedPackages.map((inventoryPackage) => [inventoryPackage.id, inventoryPackage]));
  const countByStatus = new Map(counts.map((item) => [item.status, item.count]));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {jobStatuses.map((status) => (
          <StatCard
            key={status}
            label={`${status.toLowerCase()} jobs`}
            value={String(countByStatus.get(status) ?? 0)}
            detail="Fake Metrc sync queue"
          />
        ))}
      </div>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Fake Metrc sync jobs</h2>
            <p className="mt-1 text-sm text-ink/60">Pending, running, succeeded, and failed package sync work.</p>
          </div>
          <form action={processPendingSyncJobs}>
            <button className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">
              Process pending jobs
            </button>
          </form>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase text-ink/50">
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Related package</th>
                <th className="py-2 pr-3">Sync</th>
                <th className="py-2 pr-3">Attempts</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const relatedPackage = job.targetEntityId ? packageById.get(job.targetEntityId) : null;

                return (
                  <tr key={job.id} className="border-b border-ink/10">
                    <td className="py-3 pr-3 font-medium text-ink">{job.status}</td>
                    <td className="py-3 pr-3 text-ink/70">{job.type}</td>
                    <td className="py-3 pr-3">
                      {relatedPackage ? (
                        <Link href={`/inventory/${relatedPackage.id}`} className="font-semibold text-moss">
                          {relatedPackage.label}
                        </Link>
                      ) : (
                        <span className="text-ink/50">Not linked</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-ink/70">{job.syncStatus}</td>
                    <td className="py-3 pr-3 text-ink/70">{job.attempts}</td>
                    <td className="py-3 pr-3 text-ink/70">{formatDateTime(job.createdAt)}</td>
                    <td className="py-3 pr-3 text-clay">{job.lastError}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
