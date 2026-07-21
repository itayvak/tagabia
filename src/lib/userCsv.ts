import { hashPassword } from "@/lib/password";
import { PLATOONS, TOTAL_TEAMS } from "@/lib/platoons";
import { isRole } from "@/lib/roles";
import type { FirestoreUser, Platoon, Role } from "@/types/user";

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

export interface UserFieldsInput {
  fullname: string;
  password?: string;
  rank: string;
  role: string;
  platoon: string;
  team: number | string;
}

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

export function validateUserFields(
  input: UserFieldsInput,
  context?: string,
): { data: Omit<FirestoreUser, "personalTodos"> } | { error: string } {
  const prefix = context ? `${context}: ` : "";

  const fullname = input.fullname.trim();
  if (!fullname) {
    return { error: `${prefix}fullname is required` };
  }

  const rank = input.rank.trim();
  if (!rank) {
    return { error: `${prefix}rank is required` };
  }

  const role = input.role.trim();
  if (!isRole(role)) {
    return { error: `${prefix}invalid role` };
  }

  const platoon = input.platoon.trim();
  if (!isPlatoon(platoon)) {
    return { error: `${prefix}invalid platoon` };
  }

  const team =
    typeof input.team === "number" ? input.team : Number(String(input.team).trim());
  if (!Number.isInteger(team) || team < 1 || team > TOTAL_TEAMS) {
    return { error: `${prefix}invalid team` };
  }

  const passwordInput = input.password?.trim() ?? "";

  return {
    data: {
      fullname,
      password: passwordInput ? normalizeStoredPassword(passwordInput) : "",
      rank,
      role: role as Role,
      platoon,
      team,
    },
  };
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

  const validated = validateUserFields(
    { fullname, password, rank, role, platoon, team: teamValue },
    `Row ${rowNumber}`,
  );

  if ("error" in validated) {
    return { error: validated.error };
  }

  return {
    user: {
      id,
      data: validated.data,
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
