import type {
  GetCourseConfigErrorResponse,
  GetCourseConfigSuccessResponse,
} from "@/types/courseConfig";

export async function fetchCourseConfig() {
  const response = await fetch("/api/course-config");

  const data = (await response.json()) as
    | GetCourseConfigSuccessResponse
    | GetCourseConfigErrorResponse;

  return { response, data };
}
