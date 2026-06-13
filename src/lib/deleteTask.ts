import type {
  DeleteTaskErrorResponse,
  DeleteTaskRequestBody,
  DeleteTaskSuccessResponse,
} from "@/types/task";

export async function deleteTask(
  taskId: string,
  body: DeleteTaskRequestBody,
) {
  const response = await fetch(
    `/api/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as
    | DeleteTaskSuccessResponse
    | DeleteTaskErrorResponse;

  return { response, data };
}
