import type { FirestoreUser } from "@/types/user";

export function userNeedsPasswordSetup(
  user: Pick<FirestoreUser, "password">,
): boolean {
  return !user.password?.trim();
}
