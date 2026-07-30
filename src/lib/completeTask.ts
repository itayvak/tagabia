import type {
  CompleteTaskErrorResponse,
  CompleteTaskRequestBody,
  CompleteTaskSuccessResponse,
} from "@/types/task";

export async function completeTask(taskId: string, body: CompleteTaskRequestBody) {
  const formData = new FormData();
  formData.append("userId", body.userId);
  if (body.answers) {
    formData.append("answers", JSON.stringify(body.answers));
  }
  for (const file of body.files ?? []) {
    formData.append("files", file);
  }

  const response = await fetch(
    `/api/tasks/${encodeURIComponent(taskId)}/complete`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = (await response.json()) as
    | CompleteTaskSuccessResponse
    | CompleteTaskErrorResponse;

  return { response, data };
}
