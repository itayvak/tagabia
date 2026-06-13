import type {
  UpdateTaskErrorResponse,
  UpdateTaskRequestBody,
  UpdateTaskSuccessResponse,
} from "@/types/task";

export async function updateTask(
  taskId: string,
  body: UpdateTaskRequestBody,
) {
  const response = await fetch(
    `/api/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as
    | UpdateTaskSuccessResponse
    | UpdateTaskErrorResponse;

  return { response, data };
}
