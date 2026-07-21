import type { FirestoreUser } from "@/types/user";

export function compareUsers(
  [idA, userA]: readonly [string, FirestoreUser],
  [idB, userB]: readonly [string, FirestoreUser],
): number {
  const platoonCompare = userA.platoon.localeCompare(userB.platoon);
  if (platoonCompare !== 0) {
    return platoonCompare;
  }

  const teamCompare = userA.team - userB.team;
  if (teamCompare !== 0) {
    return teamCompare;
  }

  const nameCompare = userA.fullname.localeCompare(userB.fullname, "he");
  if (nameCompare !== 0) {
    return nameCompare;
  }

  return idA.localeCompare(idB);
}

export function sortUserEntries(
  entries: readonly (readonly [string, FirestoreUser])[],
): [string, FirestoreUser][] {
  return [...entries].sort(compareUsers) as [string, FirestoreUser][];
}
