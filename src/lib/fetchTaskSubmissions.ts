import type {
  ListTaskSubmissionsErrorResponse,
  ListTaskSubmissionsSuccessResponse,
} from "@/types/taskForm";

export async function fetchTaskSubmissions(taskId: string, creatorId: string) {
  const params = new URLSearchParams({ creatorId });
  const response = await fetch(
    `/api/tasks/${encodeURIComponent(taskId)}/submissions?${params.toString()}`,
  );

  const data = (await response.json()) as
    | ListTaskSubmissionsSuccessResponse
    | ListTaskSubmissionsErrorResponse;

  return { response, data };
}
