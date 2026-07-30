export const ROLES = {
  peasant: "צוער",
  commander: "סגל ההכשרה",
  developer: "מפתח All In One",
  innovationBatallion: "ק. פיתוח וחדשנות גדודי",
  digitalBatallion: "ק. דיגיטל גדודי",
  AIBatallion: "ק. AI גדודי",
  administrationsBatallion: "ק. מנהות גדודי",
  logisticsBatallion: "ק. לוגיסטיקה גדודי",
  sportsBatallion: "ק. אימון גופני גדודי",
  tuitionBatallion: "ק. הדרכה גדודי",
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

export function canCreateTasks(role: Role): boolean {
  return role !== "peasant" && role !== "commander";
}

export function isCommander(role: Role): boolean {
  return role === "commander";
}

export function hasDeveloperAccess(role: Role): boolean {
  return role === "developer" || role === "AIBatallion" || role === "innovationBatallion";
}

// Maps each supervisor role to its directly subordinate role in the same domain
export const ROLE_SUBORDINATE_MAP: Partial<Record<Role, Role>> = {
  tuitionBatallion: "tuitionPlatoon",
  sportsBatallion: "sportsPlatoon",
  logisticsBatallion: "logisticsPlatoon",
  tuitionPlatoon: "tuitionTeam",
  simulationPlatoon: "simulationTeam",
};

export function getSubordinateRole(role: Role): Role | null {
  return ROLE_SUBORDINATE_MAP[role] ?? null;
}

const BATTALION_ROLES: Role[] = [
  "digitalBatallion",
  "AIBatallion",
  "administrationsBatallion",
  "logisticsBatallion",
  "sportsBatallion",
  "tuitionBatallion",
  "innovationBatallion"
];

export function isBattalionRole(role: Role): boolean {
  return BATTALION_ROLES.includes(role);
}

const PLATOON_ROLES: Role[] = [
  "medicalPlatoon",
  "safetyPlatoon",
  "educationPlatoon",
  "tuitionPlatoon",
  "logisticsPlatoon",
  "sportsPlatoon",
  "missionsPlatoon",
  "simulationPlatoon",
  "trainingPlatoon",
];

export function isPlatoonRole(role: Role): boolean {
  return PLATOON_ROLES.includes(role);
}
