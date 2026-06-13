import type {
  CompleteTaskErrorResponse,
  CompleteTaskRequestBody,
  CompleteTaskSuccessResponse,
} from "@/types/task";

export async function completeTask(taskId: string, body: CompleteTaskRequestBody) {
  const response = await fetch(
    `/api/tasks/${encodeURIComponent(taskId)}/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as
    | CompleteTaskSuccessResponse
    | CompleteTaskErrorResponse;

  return { response, data };
}
