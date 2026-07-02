export type Platoon = "A" | "B" | "C" | "D" | "E";

export interface FirestoreUser {
  fullname: string;
  password: string;
  rank: string;
  role: Role;
  platoon: Platoon;
  team: number;
}

export type Role = "peasant" 
| "developer" // מפתח מערכת
| "platoonCommander" // מפקד פלוגה
| "safetyPlatoon" // קצין בטיחות פלוגתי
| "logisticsPlatoon" // קצין לוגיסטיקה פלוגתי
| "medicalPlatoon" // קצין רפואה פלוגתי
| "sportsPlatoon" // קצין אימון גופני פלוגתי
| "tuitionPlatoon" // קצין הדרכה פלוגתי
| "teamCommander" // מפקד צוות
| "weeklyTeamCommander" // מפקד מתנסה שבועי
| "tuitionTeam" // קצין הדרכה צוותי

export interface PublicUser {
  id: string;
  fullname: string;
  rank: string;
  role: Role;
  platoon: Platoon;
  team: number;
}

export interface LoginRequestBody {
  id: string;
  password?: string;
}

export interface LoginSuccessResponse {
  user: PublicUser;
}

export interface LoginNeedsPasswordSetupResponse {
  needsPasswordSetup: true;
  userId: string;
}

export interface LoginErrorResponse {
  error: string;
}

export interface SetPasswordRequestBody {
  id: string;
  password: string;
}

export interface SetPasswordSuccessResponse {
  user: PublicUser;
}

export interface SetPasswordErrorResponse {
  error: string;
}

export interface ImportUsersRequestBody {
  userId: string;
  csv: string;
}

export interface ImportUsersSuccessResponse {
  created: number;
  updated: number;
  unchanged: number;
  deleted: number;
}

export interface ImportUsersErrorResponse {
  error: string;
}
