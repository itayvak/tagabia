import type { Firestore } from "firebase-admin/firestore";
import {
  PLATOONS,
  TOTAL_TEAMS,
  createEmptyAssigneeSelection,
  getTeamsForPlatoon,
  type AssigneeSelection,
} from "@/lib/platoons";
import type { FirestoreUser } from "@/types/user";

const FIRESTORE_IN_LIMIT = 30;

export function isValidTeamId(team: number): boolean {
  return Number.isInteger(team) && team >= 1 && team <= TOTAL_TEAMS;
}

export function normalizeTeamIds(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }

  const teamIds = new Set<number>();

  for (const item of raw) {
    const team = typeof item === "number" ? item : Number(item);
    if (!isValidTeamId(team)) {
      return null;
    }
    teamIds.add(team);
  }

  return [...teamIds].sort((a, b) => a - b);
}

export function selectionToTeamIds(selection: AssigneeSelection): number[] {
  const teamIds = new Set<number>();

  for (const platoon of PLATOONS) {
    const platoonSelection = selection[platoon];

    if (platoonSelection.entirePlatoon) {
      getTeamsForPlatoon(platoon).forEach((team) => teamIds.add(team));
      continue;
    }

    platoonSelection.teams.forEach((team) => teamIds.add(team));
  }

  return [...teamIds].sort((a, b) => a - b);
}

export function teamIdsToSelection(teamIds: number[]): AssigneeSelection {
  const teamSet = new Set(teamIds);
  const selection = createEmptyAssigneeSelection();

  for (const platoon of PLATOONS) {
    const platoonTeams = getTeamsForPlatoon(platoon);
    const selectedTeams = platoonTeams.filter((team) => teamSet.has(team));

    selection[platoon] =
      selectedTeams.length === platoonTeams.length
        ? { entirePlatoon: true, teams: platoonTeams }
        : { entirePlatoon: false, teams: selectedTeams };
  }

  return selection;
}

export function isUserAssignedToTeams(
  userTeam: number,
  assignedTeams: number[],
): boolean {
  return assignedTeams.includes(userTeam);
}

export interface UserInTeam {
  id: string;
  data: FirestoreUser;
}

export async function getUsersInTeams(
  db: Firestore,
  teamIds: number[],
): Promise<UserInTeam[]> {
  const normalizedTeamIds = normalizeTeamIds(teamIds);
  if (!normalizedTeamIds || normalizedTeamIds.length === 0) {
    return [];
  }

  const usersById = new Map<string, FirestoreUser>();

  for (let index = 0; index < normalizedTeamIds.length; index += FIRESTORE_IN_LIMIT) {
    const chunk = normalizedTeamIds.slice(index, index + FIRESTORE_IN_LIMIT);
    const snapshot = await db
      .collection("users")
      .where("team", "in", chunk)
      .get();

    snapshot.docs.forEach((doc) => {
      usersById.set(doc.id, doc.data() as FirestoreUser);
    });
  }

  return [...usersById.entries()]
    .map(([id, data]) => ({ id, data }))
    .sort((a, b) => {
      if (a.data.team !== b.data.team) {
        return a.data.team - b.data.team;
      }

      return a.data.fullname.localeCompare(b.data.fullname, "he");
    });
}
