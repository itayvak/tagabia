import type {
  GetTaskErrorResponse,
  GetTaskSuccessResponse,
} from "@/types/task";

export async function fetchTask(taskId: string, userId: string) {
  const params = new URLSearchParams({ userId });
  const response = await fetch(
    `/api/tasks/${encodeURIComponent(taskId)}?${params.toString()}`,
  );

  const data = (await response.json()) as
    | GetTaskSuccessResponse
    | GetTaskErrorResponse;

  return { response, data };
}
