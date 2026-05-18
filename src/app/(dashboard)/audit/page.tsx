import Link from "next/link";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/server/auth/current-user";
import { hasPermission } from "@/server/auth/permissions";
import { formatDateTime, summarizeMetadata } from "@/server/core/format";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-md border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/60">{message}</p>;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const canReadAudit = hasPermission(user, "audit:read");
  const action = getParam(params, "action");
  const entityType = getParam(params, "entityType");
  const facilityId = getParam(params, "facilityId");
  const actorUserId = getParam(params, "actorUserId");
  const where: Prisma.AuditLogWhereInput = {
    AND: [
      action ? { action: { contains: action, mode: "insensitive" } } : {},
      entityType ? { entityType } : {},
      facilityId ? { facilityId } : {},
      actorUserId ? { actorUserId } : {}
    ]
  };

  const [events, entityTypes, facilities, actors] = canReadAudit
    ? await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            actor: true,
            facility: true
          },
          orderBy: { createdAt: "desc" },
          take: 100
        }),
        prisma.auditLog.findMany({
          distinct: ["entityType"],
          orderBy: { entityType: "asc" },
          select: { entityType: true }
        }),
        prisma.facility.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true }
        }),
        prisma.user.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true }
        })
      ])
    : [[], [], [], []];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-ink">Audit log</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Review operational events without exposing sensitive payloads or credentials.
          </p>
        </div>

        {canReadAudit ? (
          <form className="mt-6 grid gap-3 md:grid-cols-5">
            <label>
              <span className="text-xs font-medium uppercase text-ink/60">Action</span>
              <input
                name="action"
                defaultValue={action}
                placeholder="product.updated"
                className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
              />
            </label>
            <label>
              <span className="text-xs font-medium uppercase text-ink/60">Entity type</span>
              <select name="entityType" defaultValue={entityType} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
                <option value="">All entities</option>
                {entityTypes.map((item) => (
                  <option key={item.entityType} value={item.entityType}>
                    {item.entityType}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-medium uppercase text-ink/60">Facility</span>
              <select name="facilityId" defaultValue={facilityId} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
                <option value="">All facilities</option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-medium uppercase text-ink/60">Actor</span>
              <select name="actorUserId" defaultValue={actorUserId} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm">
                <option value="">All actors</option>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">Filter</button>
              <Link href="/audit" className="rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold text-ink">
                Clear
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-6">
            <EmptyState message={`Role ${user.role} cannot view the audit log.`} />
          </div>
        )}
      </section>

      {canReadAudit ? (
        <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="border-b border-ink/10 px-5 py-4">
            <h2 className="text-lg font-semibold text-ink">Events</h2>
          </div>
          <div className="divide-y divide-ink/10">
            {events.length === 0 ? (
              <div className="p-5">
                <EmptyState message="No audit events match the current filters." />
              </div>
            ) : null}
            {events.map((event) => (
              <div key={event.id} className="grid gap-3 p-5 text-sm md:grid-cols-6">
                <div>
                  <p className="text-xs uppercase text-ink/50">Timestamp</p>
                  <p className="mt-1 font-medium text-ink">{formatDateTime(event.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Actor</p>
                  <p className="mt-1 text-ink/70">{event.actor?.name ?? "System"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Action</p>
                  <p className="mt-1 font-medium text-ink">{event.action}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Entity</p>
                  <p className="mt-1 text-ink/70">{event.entityType}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Entity ID</p>
                  <p className="mt-1 break-all font-mono text-xs text-ink/60">{event.entityId ?? "None"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Metadata</p>
                  <p className="mt-1 text-ink/70">{summarizeMetadata(event.metadata)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
