import type { Role } from "@/types/user";

export const ROLE_LABELS: Record<Role, string> = {
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
};

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role];
}
