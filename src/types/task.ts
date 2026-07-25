import type { TaskFormField, TaskFormFieldInput, TaskSubmission } from "@/types/taskForm";
import type { TaskCategory } from "@/lib/taskCategory";
import type { Platoon, Role } from "@/types/user";
import type { Timestamp } from "firebase-admin/firestore";

export interface TaskMedia {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
}

export interface FirestoreTask {
  title: string;
  content: string;
  category: TaskCategory;
  creatorId: string;
  creatorName: string;
  creatorRank: string;
  creatorRole: Role;
  creatorPlatoon?: Platoon;
  dueDate: Timestamp;
  assignedTeams: number[];
  assignedUsers: string[];
  hasFormFields?: boolean;
  requiresCampusSubmission?: boolean;
  media?: TaskMedia[];
}

export interface PublicTask {
  id: string;
  title: string;
  content: string;
  category: TaskCategory;
  creatorId: string;
  creatorName: string;
  creatorRank: string;
  creatorRole: Role;
  creatorPlatoon?: Platoon;
  dueDate: string;
  assignedTeams: number[];
  assignedUsers: string[];
  hasFormFields: boolean;
  requiresCampusSubmission: boolean;
  formFields?: TaskFormField[];
  submissionCount?: number;
  media: TaskMedia[];
}

export interface AssignedTask extends PublicTask {
  completed: boolean;
  completedAt: string | null;
  submission?: TaskSubmission | null;
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
  category: TaskCategory;
  creatorId: string;
  dueDate: string;
  assignedTeams: number[];
  assignedUsers?: string[];
  formFields?: TaskFormFieldInput[];
  requiresCampusSubmission?: boolean;
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
  category: TaskCategory;
  dueDate: string;
  assignedTeams: number[];
  assignedUsers?: string[];
  formFields?: TaskFormFieldInput[];
  requiresCampusSubmission?: boolean;
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
  answers?: Record<string, string>;
}

export interface CompleteTaskSuccessResponse {
  completedAt: string;
}

export interface CompleteTaskErrorResponse {
  error: string;
}

export interface UncompleteTaskRequestBody {
  userId: string;
}

export interface UncompleteTaskSuccessResponse {
  uncompleted: true;
}

export interface UncompleteTaskErrorResponse {
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
