import type {
  UpdateWorkEnvironmentFileTitleErrorResponse,
  UpdateWorkEnvironmentFileTitleRequestBody,
  UpdateWorkEnvironmentFileTitleSuccessResponse,
  WorkEnvironmentFileKey,
} from "@/types/workEnvironment";

export async function updateWorkEnvironmentFileTitle(
  fileKey: WorkEnvironmentFileKey,
  payload: UpdateWorkEnvironmentFileTitleRequestBody,
) {
  const response = await fetch(`/api/work-environment/files/${fileKey}/title`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | UpdateWorkEnvironmentFileTitleSuccessResponse
    | UpdateWorkEnvironmentFileTitleErrorResponse;

  return { response, data };
}
