import type {
  ListTasksErrorResponse,
  ListTasksSuccessResponse,
} from "@/types/task";

export async function fetchCreatedTasks(creatorId: string) {
  const response = await fetch(
    `/api/tasks/created?creatorId=${encodeURIComponent(creatorId)}`,
  );

  const data = (await response.json()) as
    | ListTasksSuccessResponse
    | ListTasksErrorResponse;

  return { response, data };
}
