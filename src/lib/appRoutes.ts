import type { PublicUser } from "@/types/user";

export function getUserHomePath(user: Pick<PublicUser, "role">): string {
  return user.role === "commander" ? "/commander" : "/allTasks";
}

export function isCommanderAllowedPage(pathname: string): boolean {
  return pathname === "/" || pathname === "/commander";
}
