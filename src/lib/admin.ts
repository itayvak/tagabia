export function getAdminUserId(): string | undefined {
  return process.env.NEXT_PUBLIC_ADMIN_USER_ID;
}

export function isAdminUser(userId: string): boolean {
  const adminUserId = getAdminUserId();
  return Boolean(adminUserId && userId === adminUserId);
}
