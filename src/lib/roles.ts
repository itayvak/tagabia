export const ROLES = {
  peasant: "חייל",
  developer: 'מפתח תגב"ייה',
  platoonCommander: 'מ"פ',
  safetyPlatoon: "קצין בטיחות פלוגתי",
  logisticsPlatoon: "קצין לוגיסטיקה פלוגתי",
  medicalPlatoon: "קצין רפואה פלוגתי",
  sportsPlatoon: "קצין אימון גופני פלוגתי",
  tuitionPlatoon: "קצין הדרכה פלוגתי",
  teamCommander: 'מפק"צ',
  weeklyTeamCommander: 'ממ"ש',
  tuitionTeam: "קצין הדרכה צוותי",
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
