import type { Role } from "@/lib/roles";

export type { Role } from "@/lib/roles";

export type Platoon = "A" | "B" | "C" | "D" | "E";

export interface PersonalTodoItem {
  id: string;
  text: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

export interface FirestoreUser {
  fullname: string;
  password: string;
  rank: string;
  role: Role;
  platoon: Platoon;
  team: number;
  personalTodos?: PersonalTodoItem[];
  requestedPasswordReset?: boolean;
}

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

export interface RequestPasswordResetRequestBody {
  id: string;
}

export interface RequestPasswordResetSuccessResponse {
  requested: true;
}

export interface RequestPasswordResetErrorResponse {
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

export interface AdminUserListItem extends PublicUser {
  needsPasswordSetup: boolean;
  requestedPasswordReset: boolean;
}

export interface ListAdminUsersSuccessResponse {
  users: AdminUserListItem[];
}

export interface ListAdminUsersErrorResponse {
  error: string;
}

export interface CreateAdminUserInput {
  id: string;
  fullname: string;
  password?: string;
  rank: string;
  role: Role;
  platoon: Platoon;
  team: number;
}

export interface CreateAdminUserRequestBody {
  userId: string;
  user: CreateAdminUserInput;
}

export interface CreateAdminUserSuccessResponse {
  user: AdminUserListItem;
}

export interface CreateAdminUserErrorResponse {
  error: string;
}

export interface UpdateAdminUserInput {
  fullname: string;
  password?: string;
  resetPassword?: boolean;
  rank: string;
  role: Role;
  platoon: Platoon;
  team: number;
}

export interface UpdateAdminUserRequestBody {
  userId: string;
  user: UpdateAdminUserInput;
}

export interface UpdateAdminUserSuccessResponse {
  user: AdminUserListItem;
}

export interface UpdateAdminUserErrorResponse {
  error: string;
}

export interface DeleteAdminUserSuccessResponse {
  deleted: true;
}

export interface DeleteAdminUserErrorResponse {
  error: string;
}

export interface GetPersonalTodosSuccessResponse {
  todos: PersonalTodoItem[];
}

export interface GetPersonalTodosErrorResponse {
  error: string;
}

export interface SavePersonalTodosRequestBody {
  userId: string;
  todos: PersonalTodoItem[];
}

export interface SavePersonalTodosSuccessResponse {
  todos: PersonalTodoItem[];
}

export interface SavePersonalTodosErrorResponse {
  error: string;
}
