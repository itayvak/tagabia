import { getAdminFirestore } from "@/lib/firebaseAdmin";
import {
  PLATOONS,
  createEmptyAssigneeSelection,
  getTeamsForPlatoon,
  type AssigneeSelection,
  type PlatoonSelection,
} from "@/lib/platoons";

const FIRESTORE_IN_LIMIT = 30;

function isPlatoonSelection(value: unknown): value is PlatoonSelection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const selection = value as PlatoonSelection;
  return (
    typeof selection.entirePlatoon === "boolean" &&
    Array.isArray(selection.teams) &&
    selection.teams.every((team) => Number.isInteger(team))
  );
}

export function isAssigneeSelection(value: unknown): value is AssigneeSelection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const selection = value as Partial<AssigneeSelection>;
  return PLATOONS.every((platoon) => isPlatoonSelection(selection[platoon]));
}

export async function resolveAssigneeIds(
  selection: AssigneeSelection,
): Promise<string[]> {
  const db = getAdminFirestore();
  const assigneeIds = new Set<string>();
  const teamsToQuery = new Set<number>();

  for (const platoon of PLATOONS) {
    const platoonSelection = selection[platoon];

    if (platoonSelection.entirePlatoon) {
      const snapshot = await db
        .collection("users")
        .where("platoon", "==", platoon)
        .get();

      snapshot.docs.forEach((doc) => assigneeIds.add(doc.id));
      continue;
    }

    platoonSelection.teams.forEach((team) => teamsToQuery.add(team));
  }

  const teamList = [...teamsToQuery];
  for (let index = 0; index < teamList.length; index += FIRESTORE_IN_LIMIT) {
    const chunk = teamList.slice(index, index + FIRESTORE_IN_LIMIT);
    const snapshot = await db
      .collection("users")
      .where("team", "in", chunk)
      .get();

    snapshot.docs.forEach((doc) => assigneeIds.add(doc.id));
  }

  return [...assigneeIds];
}

export async function deriveAssigneeSelection(
  assigneeIds: string[],
): Promise<AssigneeSelection> {
  const db = getAdminFirestore();
  const assigneeSet = new Set(assigneeIds);
  const selection = createEmptyAssigneeSelection();

  for (const platoon of PLATOONS) {
    const platoonTeams = getTeamsForPlatoon(platoon);
    const selectedTeams: number[] = [];

    for (const team of platoonTeams) {
      const snapshot = await db
        .collection("users")
        .where("team", "==", team)
        .get();

      const teamUserIds = snapshot.docs.map((doc) => doc.id);
      if (
        teamUserIds.length > 0 &&
        teamUserIds.every((userId) => assigneeSet.has(userId))
      ) {
        selectedTeams.push(team);
      }
    }

    const platoonSelection: PlatoonSelection =
      selectedTeams.length === platoonTeams.length
        ? { entirePlatoon: true, teams: platoonTeams }
        : { entirePlatoon: false, teams: selectedTeams };

    selection[platoon] = platoonSelection;
  }

  return selection;
}
