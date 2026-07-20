export const ROLES = {
  peasant: "צוער",
  commander: "סגל ההכשרה",
  developer: "מפתח תגבייה",
  digitalBatallion: "ק. דיגיטל גדודי",
  AIBatallion: "ק. AI גדודי",
  administrationsBatallion: "ק. מנהלות גדודי",
  logisticsBatallion: "ק. לוגיסטיקה גדודי",
  sportsBatallion: "ק. אימון גופני גדודי",
  medicalPlatoon: "ק. רפואה פלוגתי",
  safetyPlatoon: "ק. בטיחות פלוגתי",
  educationPlatoon: "ק. חינוך ומורשת פלוגתי",
  tuitionPlatoon: "ק. הדרכה פלוגתי",
  logisticsPlatoon: "ק. לוגיסטיקה פלוגתי",
  sportsPlatoon: "ק. אימון גופני פלוגתי",
  missionsPlatoon: "ק. מבצעים פלוגתי",
  simulationPlatoon: "ק. סימולציות פלוגתי",
  trainingPlatoon: "ק. אימונים פלוגתי",
  platoonAssistant: 'סמ"פ', 
  weeklyTeamCommander: 'ממ"ש',
  tuitionTeam: "ק. הדרכה צוותי",
  simulationTeam: "ק. סימולציות צוותי",
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

export function hasDeveloperAccess(role: Role): boolean {
  return role === "developer" || role === "AIBatallion";
}
