import type {
  ListTasksErrorResponse,
  ListTasksSuccessResponse,
} from "@/types/task";

export async function fetchSubordinateTasks(viewerId: string) {
  const response = await fetch(
    `/api/tasks/subordinate?viewerId=${encodeURIComponent(viewerId)}`,
  );

  const data = (await response.json()) as
    | ListTasksSuccessResponse
    | ListTasksErrorResponse;

  return { response, data };
}
