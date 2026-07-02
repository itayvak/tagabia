import type { TaskMedia } from "@/types/task";

interface UploadTaskMediaSuccessResponse {
  media: TaskMedia;
}

interface UploadTaskMediaErrorResponse {
  error: string;
}

export async function uploadTaskMedia(
  taskId: string,
  userId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("file", file);

  const response = await fetch(`/api/tasks/${taskId}/media`, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as
    | UploadTaskMediaSuccessResponse
    | UploadTaskMediaErrorResponse;

  return { response, data };
}
