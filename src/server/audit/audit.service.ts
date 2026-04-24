import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type { AuditEventInput } from "./audit.types";

const SENSITIVE_KEYS = [
  "apiKey",
  "authorization",
  "encryptedUserApiKey",
  "integratorKey",
  "integratorApiKey",
  "password",
  "secret",
  "token",
  "userApiKey"
];

function redactJson(value: Prisma.InputJsonValue | null | undefined): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactJson(item) ?? null);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
          key.toLowerCase().includes(sensitiveKey.toLowerCase())
        );

        return [key, isSensitive ? "[REDACTED]" : redactJson(entry as Prisma.InputJsonValue) ?? null];
      })
    );
  }

  return value;
}

export async function recordAuditEvent(input: AuditEventInput) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      facilityId: input.facilityId ?? null,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: redactJson(input.before),
      after: redactJson(input.after),
      metadata: redactJson(input.metadata),
      requestId: input.requestId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null
    }
  });
}
