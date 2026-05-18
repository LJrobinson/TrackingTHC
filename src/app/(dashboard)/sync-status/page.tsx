import Link from "next/link";
import { Prisma, SyncJobStatus, SyncJobType } from "@prisma/client";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentUser } from "@/server/auth/current-user";
import { hasPermission } from "@/server/auth/permissions";
import { formatDateTime } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";
import { processPendingSyncJobs, simulateSyncFailure } from "./actions";

export const dynamic = "force-dynamic";

const jobStatuses = Object.values(SyncJobStatus);
const jobTypes = Object.values(SyncJobType);

type SyncStatusPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-md border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/60">{message}</p>;
}

export default async function SyncStatusPage({ searchParams }: SyncStatusPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const canWriteSync = hasPermission(user, "sync:write");
  const statusParam = getParam(params, "status");
  const typeParam = getParam(params, "type");
  const status = jobStatuses.includes(statusParam as SyncJobStatus) ? (statusParam as SyncJobStatus) : "";
  const type = jobTypes.includes(typeParam as SyncJobType) ? (typeParam as SyncJobType) : "";
  const packageQuery = getParam(params, "package");
  const where: Prisma.MetrcSyncJobWhereInput = {
    AND: [
      status ? { status } : {},
      type ? { type } : {},
      packageQuery
        ? {
            OR: [
              { targetEntityId: { contains: packageQuery, mode: "insensitive" } },
              {
                targetEntityId: {
                  in: (
                    await prisma.inventoryPackage.findMany({
                      where: {
                        OR: [
                          { label: { contains: packageQuery, mode: "insensitive" } },
                          { product: { name: { contains: packageQuery, mode: "insensitive" } } }
                        ]
                      },
                      select: { id: true }
                    })
                  ).map((inventoryPackage) => inventoryPackage.id)
                }
              }
            ]
          }
        : {}
    ]
  };
  const [jobs, counts] = await Promise.all([
    prisma.metrcSyncJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    Promise.all(
      jobStatuses.map(async (item) => ({
        status: item,
        count: await prisma.metrcSyncJob.count({ where: { status: item } })
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
        {jobStatuses.map((item) => (
          <StatCard
            key={item}
            label={`${item.toLowerCase()} jobs`}
            value={String(countByStatus.get(item) ?? 0)}
            detail="Fake Metrc sync queue"
          />
        ))}
      </div>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-5">
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Status</span>
            <select name="status" defaultValue={status} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
              <option value="">All statuses</option>
              {jobStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-medium uppercase text-ink/60">Type</span>
            <select name="type" defaultValue={type} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
              <option value="">All types</option>
              {jobTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-medium uppercase text-ink/60">Package</span>
            <input
              name="package"
              defaultValue={packageQuery}
              placeholder="Package label or product"
              className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end gap-2">
            <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">Filter</button>
            <Link href="/sync-status" className="rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold text-ink">
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Fake Metrc sync jobs</h2>
            <p className="mt-1 text-sm text-ink/60">Grouped by status so pending and failed work stays visible.</p>
          </div>
          {canWriteSync ? (
            <form action={processPendingSyncJobs}>
              <button className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">
                Process pending jobs
              </button>
            </form>
          ) : (
            <p className="rounded-md border border-ink/10 px-3 py-2 text-sm text-ink/60">
              Role {user.role} cannot process sync jobs.
            </p>
          )}
        </div>

        <div className="mt-6 space-y-6">
          {jobStatuses.map((item) => {
            const jobsForStatus = jobs.filter((job) => job.status === item);

            return (
              <section key={item} className="rounded-md border border-ink/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-ink">{item}</h3>
                  <p className="text-sm text-ink/60">{jobsForStatus.length} shown</p>
                </div>

                {jobsForStatus.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState message={`No ${item.toLowerCase()} fake Metrc sync jobs match the current filters.`} />
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-ink/10 text-xs uppercase text-ink/50">
                          <th className="py-2 pr-3">Package</th>
                          <th className="py-2 pr-3">Product</th>
                          <th className="py-2 pr-3">Job type</th>
                          <th className="py-2 pr-3">Created</th>
                          <th className="py-2 pr-3">Completed</th>
                          <th className="py-2 pr-3">Retries</th>
                          <th className="py-2 pr-3">Sync</th>
                          <th className="py-2 pr-3">Error</th>
                          <th className="py-2 pr-3">Simulate failure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobsForStatus.map((job) => {
                          const relatedPackage = job.targetEntityId ? packageById.get(job.targetEntityId) : null;
                          const canFail = canWriteSync && job.status !== SyncJobStatus.SUCCEEDED;

                          return (
                            <tr key={job.id} className="border-b border-ink/10 align-top last:border-0">
                              <td className="py-3 pr-3">
                                {relatedPackage ? (
                                  <Link href={`/inventory/${relatedPackage.id}`} className="font-semibold text-moss">
                                    {relatedPackage.label}
                                  </Link>
                                ) : (
                                  <span className="text-ink/50">Not linked</span>
                                )}
                              </td>
                              <td className="py-3 pr-3 text-ink/70">{relatedPackage?.product.name ?? "Not linked"}</td>
                              <td className="py-3 pr-3 text-ink/70">{job.type}</td>
                              <td className="py-3 pr-3 text-ink/70">{formatDateTime(job.createdAt)}</td>
                              <td className="py-3 pr-3 text-ink/70">{formatDateTime(job.completedAt)}</td>
                              <td className="py-3 pr-3 text-ink/70">{job.attempts}</td>
                              <td className="py-3 pr-3 text-ink/70">{job.syncStatus}</td>
                              <td className="py-3 pr-3 text-clay">{job.lastError ?? "None"}</td>
                              <td className="py-3 pr-3">
                                {canFail ? (
                                  <form action={simulateSyncFailure} className="flex min-w-72 gap-2">
                                    <input type="hidden" name="jobId" value={job.id} />
                                    <input
                                      name="reason"
                                      required
                                      minLength={3}
                                      placeholder="Failure reason"
                                      className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
                                    />
                                    <button className="rounded-md border border-clay px-3 py-2 text-sm font-semibold text-clay">
                                      Fail
                                    </button>
                                  </form>
                                ) : (
                                  <span className="text-ink/40">Unavailable</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
