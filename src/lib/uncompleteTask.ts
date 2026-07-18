import type {
  UncompleteTaskErrorResponse,
  UncompleteTaskRequestBody,
  UncompleteTaskSuccessResponse,
} from "@/types/task";

export async function uncompleteTask(
  taskId: string,
  body: UncompleteTaskRequestBody,
) {
  const response = await fetch(
    `/api/tasks/${encodeURIComponent(taskId)}/complete`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as
    | UncompleteTaskSuccessResponse
    | UncompleteTaskErrorResponse;

  return { response, data };
}
