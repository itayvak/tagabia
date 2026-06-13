import type {
  CreateTaskErrorResponse,
  CreateTaskRequestBody,
  CreateTaskSuccessResponse,
} from "@/types/task";

export async function createTask(body: CreateTaskRequestBody) {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as
    | CreateTaskSuccessResponse
    | CreateTaskErrorResponse;

  return { response, data };
}
