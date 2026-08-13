import type {
  UpdateGoogleCalendarConfigErrorResponse,
  UpdateGoogleCalendarConfigRequest,
  UpdateGoogleCalendarConfigSuccessResponse,
} from "@/types/googleCalendar";

export async function updateGoogleCalendarConfig(
  payload: UpdateGoogleCalendarConfigRequest,
) {
  const response = await fetch("/api/admin/google-calendar-config", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | UpdateGoogleCalendarConfigSuccessResponse
    | UpdateGoogleCalendarConfigErrorResponse;

  return { response, data };
}
