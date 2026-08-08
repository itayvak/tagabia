import type {
  UploadWorkEnvironmentFileErrorResponse,
  UploadWorkEnvironmentFileSuccessResponse,
  WorkEnvironmentFileKey,
} from "@/types/workEnvironment";

export async function uploadWorkEnvironmentFile(
  fileKey: WorkEnvironmentFileKey,
  userId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("file", file);

  const response = await fetch(`/api/work-environment/files/${fileKey}`, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as
    | UploadWorkEnvironmentFileSuccessResponse
    | UploadWorkEnvironmentFileErrorResponse;

  return { response, data };
}
