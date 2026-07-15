export const ROLES = {
  peasant: "צוער",
  commander: "סגל ההכשרה",
  developer: "מפתח תגבייה",
  medicalPlatoon: "קצין רפואה פלוגתי",
  safetyPlatoon: "קצין בטיחות פלוגתי",
  educationPlatoon: "קצין חינוך ומורשת פלוגתי",
  tuitionPlatoon: "קצין הדרכה פלוגתי",
  logisticsPlatoon: "קצין לוגיסטיקה פלוגתי",
  sportsPlatoon: "קצין אימון גופני פלוגתי",
  missionsPlatoon: "קצין מבצעים פלוגתי",
  simulationPlatoon: "קצין סימולציות פלוגתי",
  trainingPlatoon: "קצין אימונים פלוגתי",
  weeklyTeamCommander: 'ממ"ש',
  tuitionTeam: "קצין הדרכה צוותי",
  simulationTeam: "קצין סימולציות צוותי",
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_LIST = Object.keys(ROLES) as Role[];

export const ROLE_LABELS = ROLES;

export function getRoleLabel(role: Role): string {
  return ROLES[role];
}

export function isRole(value: string): value is Role {
  return value in ROLES;
}

export function canManageTasks(role: Role): boolean {
  return role !== "peasant";
}
