import type {
  ListWorkEnvironmentFilesErrorResponse,
  ListWorkEnvironmentFilesSuccessResponse,
} from "@/types/workEnvironment";

export async function fetchWorkEnvironmentFiles() {
  const response = await fetch("/api/work-environment/files");

  const data = (await response.json()) as
    | ListWorkEnvironmentFilesSuccessResponse
    | ListWorkEnvironmentFilesErrorResponse;

  return { response, data };
}
