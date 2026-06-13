import type { Role } from "@/types/user";

export const ROLE_LABELS: Record<Role, string> = {
  peasant: "חייל",
  developer: 'מפתח תגב"ייה',
  safetyPlatoon: "קצין בטיחות פלוגתי",
  logisticsPlatoon: "קצין לוגיסטיקה פלוגתי",
  logisticsBattalion: "קצין לוגיסטיקה גדודי",
  teamCommander: 'מפק"צ',
  platoonCommander: 'מ"פ',
};

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role];
}
