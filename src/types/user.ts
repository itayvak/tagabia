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
| "safetyPlatoon" // קצין בטיחות פלוגתי 
| "logisticsPlatoon" // קצין לוגיסטיקה פלוגתי 
| "logisticsBattalion" // קצין לוגיסטיקה גדודי
| "teamCommander" // מפקד צוות
| "platoonCommander" // מפקד פלוגה

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
