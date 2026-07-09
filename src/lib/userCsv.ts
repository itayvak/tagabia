import { hashPassword } from "@/lib/password";
import { PLATOONS, TOTAL_TEAMS } from "@/lib/platoons";
import { isRole } from "@/lib/roles";
import type { FirestoreUser, Platoon } from "@/types/user";

export const USER_CSV_HEADERS = [
  "id",
  "fullname",
  "password",
  "rank",
  "role",
  "platoon",
  "team",
] as const;

const PASSWORD_HASH_PATTERN = /^[a-fA-F0-9]{64}$/;

export function normalizeStoredPassword(password: string): string {
  const trimmed = password.trim();

  if (!trimmed) {
    return "";
  }

  return PASSWORD_HASH_PATTERN.test(trimmed)
    ? trimmed.toLowerCase()
    : hashPassword(trimmed);
}

function isPlatoon(value: string): value is Platoon {
  return PLATOONS.includes(value as Platoon);
}

export function parseUserCsvRow(
  row: string[],
  rowNumber: number,
): { user: { id: string; data: FirestoreUser } } | { error: string } {
  if (row.length !== USER_CSV_HEADERS.length) {
    return {
      error: `Row ${rowNumber}: expected ${USER_CSV_HEADERS.length} columns`,
    };
  }

  const [id, fullname, password, rank, role, platoon, teamValue] = row.map(
    (value) => value.trim(),
  );

  if (!id) {
    return { error: `Row ${rowNumber}: id is required` };
  }

  if (!fullname) {
    return { error: `Row ${rowNumber}: fullname is required` };
  }

  if (!rank) {
    return { error: `Row ${rowNumber}: rank is required` };
  }

  if (!isRole(role)) {
    return { error: `Row ${rowNumber}: invalid role` };
  }

  if (!isPlatoon(platoon)) {
    return { error: `Row ${rowNumber}: invalid platoon` };
  }

  const team = Number(teamValue);
  if (!Number.isInteger(team) || team < 1 || team > TOTAL_TEAMS) {
    return { error: `Row ${rowNumber}: invalid team` };
  }

  return {
    user: {
      id,
      data: {
        fullname,
        password: password ? normalizeStoredPassword(password) : "",
        rank,
        role,
        platoon,
        team,
      },
    },
  };
}

export function usersAreEqual(a: FirestoreUser, b: FirestoreUser): boolean {
  return (
    a.fullname === b.fullname &&
    a.password === b.password &&
    a.rank === b.rank &&
    a.role === b.role &&
    a.platoon === b.platoon &&
    a.team === b.team
  );
}
