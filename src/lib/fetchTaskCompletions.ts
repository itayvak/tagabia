import type {
  ListTaskCompletionsErrorResponse,
  ListTaskCompletionsSuccessResponse,
} from "@/types/task";

export async function fetchTaskCompletions(taskId: string, creatorId: string) {
  const params = new URLSearchParams({ creatorId });
  const response = await fetch(
    `/api/tasks/${encodeURIComponent(taskId)}/completions?${params.toString()}`,
  );

  const data = (await response.json()) as
    | ListTaskCompletionsSuccessResponse
    | ListTaskCompletionsErrorResponse;

  return { response, data };
}
