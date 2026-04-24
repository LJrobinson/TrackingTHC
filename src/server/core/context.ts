import "server-only";

import { prisma } from "@/server/db/prisma";
import { getCurrentUser } from "@/server/auth/current-user";

export type OperationalContext = {
  actorUserId: string | null;
  organizationId: string;
  facilityId: string;
  facilityLicenseId: string | null;
  licenseNumber: string | null;
  state: string | null;
  metrcBaseUrl: string | null;
};

export async function getOperationalContext(): Promise<OperationalContext> {
  const currentUser = await getCurrentUser();
  const dbUser = await prisma.user.findUnique({
    where: { email: currentUser.email },
    include: { memberships: { take: 1 } }
  });

  const organizationId =
    dbUser?.memberships[0]?.organizationId ??
    (
      await prisma.organization.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true }
      })
    )?.id;

  if (!organizationId) {
    throw new Error("No organization is available. Run the seed script before using the dashboard.");
  }

  const facility = await prisma.facility.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    include: {
      licenses: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!facility) {
    throw new Error("No facility is available. Run the seed script before using the dashboard.");
  }

  const license = facility.licenses[0] ?? null;

  return {
    actorUserId: dbUser?.id ?? null,
    organizationId,
    facilityId: facility.id,
    facilityLicenseId: license?.id ?? null,
    licenseNumber: license?.licenseNumber ?? null,
    state: license?.state ?? null,
    metrcBaseUrl: license?.metrcBaseUrl ?? null
  };
}
