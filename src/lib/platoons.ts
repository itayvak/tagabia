import type { Platoon } from "@/types/user";

export const PLATOONS: Platoon[] = ["A", "B", "C", "D", "E"];

export const PLATOON_LABELS: Record<Platoon, string> = {
  A: "ארבל",
  B: "בנטל",
  C: "גולן",
  D: "דותן",
  E: "הראל",
};

export function formatPlatoonLabel(platoon: Platoon): string {
  return PLATOON_LABELS[platoon];
}

export const TEAMS_PER_PLATOON = 4;

export const TOTAL_TEAMS = PLATOONS.length * TEAMS_PER_PLATOON;

export interface PlatoonSelection {
  entirePlatoon: boolean;
  teams: number[];
}

export type AssigneeSelection = Record<Platoon, PlatoonSelection>;

export function getTeamsForPlatoon(platoon: Platoon): number[] {
  const platoonIndex = PLATOONS.indexOf(platoon);
  const startTeam = platoonIndex * TEAMS_PER_PLATOON + 1;

  return Array.from(
    { length: TEAMS_PER_PLATOON },
    (_, index) => startTeam + index,
  );
}

export function getPlatoonForTeam(team: number): Platoon | null {
  if (!Number.isInteger(team) || team < 1 || team > TOTAL_TEAMS) {
    return null;
  }

  return PLATOONS[Math.floor((team - 1) / TEAMS_PER_PLATOON)] ?? null;
}

export function createEmptyAssigneeSelection(): AssigneeSelection {
  return PLATOONS.reduce((selection, platoon) => {
    selection[platoon] = { entirePlatoon: false, teams: [] };
    return selection;
  }, {} as AssigneeSelection);
}

export function createEntireBattalionSelection(): AssigneeSelection {
  return PLATOONS.reduce((selection, platoon) => {
    const teams = getTeamsForPlatoon(platoon);
    selection[platoon] = { entirePlatoon: true, teams };
    return selection;
  }, {} as AssigneeSelection);
}

export function isEntireBattalionSelected(selection: AssigneeSelection): boolean {
  return PLATOONS.every((platoon) => selection[platoon].entirePlatoon);
}

export function getAssigneeSummaryItems(
  selection: AssigneeSelection,
): string[] {
  return PLATOONS.flatMap((platoon) => {
    const platoonSelection = selection[platoon];

    if (platoonSelection.entirePlatoon) {
      return [`פלוגת ${formatPlatoonLabel(platoon)} (כל)`];
    }

    if (platoonSelection.teams.length > 0) {
      const teams = [...platoonSelection.teams].sort((a, b) => a - b).join(", ");
      return [`פלוגת ${formatPlatoonLabel(platoon)} (צוות ${teams})`];
    }

    return [];
  });
}

export function countAssigneeTargets(selection: AssigneeSelection): number {
  return getAssigneeSummaryItems(selection).length;
}

export function hasAssigneeSelection(selection: AssigneeSelection): boolean {
  return PLATOONS.some(
    (platoon) =>
      selection[platoon].entirePlatoon || selection[platoon].teams.length > 0,
  );
}
