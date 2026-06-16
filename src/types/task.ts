import type { Platoon, Role } from "@/types/user";
import type { Timestamp } from "firebase-admin/firestore";

export interface FirestoreTask {
  title: string;
  content: string;
  creatorId: string;
  creatorName: string;
  creatorRank: string;
  creatorRole: Role;
  dueDate: Timestamp;
  assignedTeams: number[];
}

export interface PublicTask {
  id: string;
  title: string;
  content: string;
  creatorId: string;
  creatorName: string;
  creatorRank: string;
  creatorRole: Role;
  dueDate: string;
  assignedTeams: number[];
}

export interface AssignedTask extends PublicTask {
  completed: boolean;
  completedAt: string | null;
}

export type AssignedTaskFilter = "pending" | "completed" | "all";

export interface ListAssignedTasksSuccessResponse {
  tasks: AssignedTask[];
}

export type CalendarTask = AssignedTask;

export interface ListCalendarTasksSuccessResponse {
  tasks: CalendarTask[];
}

export interface ListCalendarTasksErrorResponse {
  error: string;
}

export interface ListTasksSuccessResponse {
  tasks: PublicTask[];
}

export interface ListTasksErrorResponse {
  error: string;
}

export interface CreateTaskRequestBody {
  title: string;
  content: string;
  creatorId: string;
  dueDate: string;
  assignedTeams: number[];
}

export interface CreateTaskSuccessResponse {
  taskId: string;
}

export interface CreateTaskErrorResponse {
  error: string;
}

export interface UpdateTaskRequestBody {
  userId: string;
  title: string;
  content: string;
  dueDate: string;
  assignedTeams: number[];
}

export interface UpdateTaskSuccessResponse {
  taskId: string;
}

export interface UpdateTaskErrorResponse {
  error: string;
}

export interface DeleteTaskRequestBody {
  userId: string;
}

export interface DeleteTaskSuccessResponse {
  taskId: string;
}

export interface DeleteTaskErrorResponse {
  error: string;
}

export interface GetTaskSuccessResponse {
  task: AssignedTask;
}

export interface GetTaskErrorResponse {
  error: string;
}

export interface FirestoreTaskCompletion {
  completedAt: Timestamp;
  completerName: string;
  completerRank: string;
}

export interface CompleteTaskRequestBody {
  userId: string;
}

export interface CompleteTaskSuccessResponse {
  completedAt: string;
}

export interface CompleteTaskErrorResponse {
  error: string;
}

export interface TaskCompletion {
  userId: string;
  completerName: string;
  completerRank: string;
  completedAt: string;
}

export interface TaskAssigneeStatus {
  userId: string;
  assigneeName: string;
  assigneeRank: string;
  platoon: Platoon;
  team: number;
  completed: boolean;
  completedAt: string | null;
}

export interface ListTaskCompletionsSuccessResponse {
  assignees: TaskAssigneeStatus[];
}

export interface ListTaskCompletionsErrorResponse {
  error: string;
}
