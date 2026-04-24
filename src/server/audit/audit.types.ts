import type { Prisma } from "@prisma/client";

export type AuditEventInput = {
  organizationId: string;
  facilityId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};
