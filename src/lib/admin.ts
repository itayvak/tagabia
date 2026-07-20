import { hasDeveloperAccess } from "@/lib/roles";
import type { PublicUser } from "@/types/user";

export function getAdminUserId(): string | undefined {
  return process.env.NEXT_PUBLIC_ADMIN_USER_ID;
}

export function isAdminUser(userId: string): boolean {
  const adminUserId = getAdminUserId();
  return Boolean(adminUserId && userId === adminUserId);
}

export function canAccessAdmin(user: Pick<PublicUser, "id" | "role">): boolean {
  return hasDeveloperAccess(user.role) || isAdminUser(user.id);
}
