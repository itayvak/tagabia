import type {
  UpdateCourseConfigErrorResponse,
  UpdateCourseConfigRequest,
  UpdateCourseConfigSuccessResponse,
} from "@/types/courseConfig";

export async function updateCourseConfig(payload: UpdateCourseConfigRequest) {
  const response = await fetch("/api/admin/course-config", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | UpdateCourseConfigSuccessResponse
    | UpdateCourseConfigErrorResponse;

  return { response, data };
}
