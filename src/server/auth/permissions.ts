import "server-only";

import type { CurrentUser } from "@/server/auth/current-user";
import { getCurrentUser } from "@/server/auth/current-user";

export type Permission = "catalog:write" | "inventory:write" | "sync:write" | "audit:read";

const rolePermissions: Record<CurrentUser["role"], Permission[]> = {
  OWNER: ["catalog:write", "inventory:write", "sync:write", "audit:read"],
  ADMIN: ["catalog:write", "inventory:write", "sync:write", "audit:read"],
  MANAGER: ["catalog:write", "inventory:write", "sync:write", "audit:read"],
  BUDTENDER: ["inventory:write", "audit:read"],
  AUDITOR: ["audit:read"]
};

export function hasPermission(user: CurrentUser, permission: Permission) {
  return rolePermissions[user.role].includes(permission);
}

export async function assertPermission(permission: Permission) {
  const user = await getCurrentUser();

  if (!hasPermission(user, permission)) {
    throw new Error(`Your role (${user.role}) does not allow this action.`);
  }
}
