import type {
  AssignedTaskFilter,
  ListAssignedTasksSuccessResponse,
  ListTasksErrorResponse,
} from "@/types/task";

export async function fetchAssignedTasks(
  userId: string,
  status: AssignedTaskFilter = "pending",
) {
  const params = new URLSearchParams({ userId, status });
  const response = await fetch(`/api/tasks/assigned?${params.toString()}`);

  const data = (await response.json()) as
    | ListAssignedTasksSuccessResponse
    | ListTasksErrorResponse;

  return { response, data };
}
