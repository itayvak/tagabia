import type {
  ListTasksErrorResponse,
  ListTasksSuccessResponse,
} from "@/types/task";

export async function fetchAssignedTasks(userId: string) {
  const response = await fetch(
    `/api/tasks/assigned?userId=${encodeURIComponent(userId)}`,
  );

  const data = (await response.json()) as
    | ListTasksSuccessResponse
    | ListTasksErrorResponse;

  return { response, data };
}
