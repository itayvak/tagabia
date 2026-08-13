import type {
  GetGoogleCalendarConfigErrorResponse,
  GetGoogleCalendarConfigSuccessResponse,
} from "@/types/googleCalendar";

export async function fetchGoogleCalendarConfig(userId: string) {
  const response = await fetch(
    `/api/admin/google-calendar-config?userId=${encodeURIComponent(userId)}`,
  );

  const data = (await response.json()) as
    | GetGoogleCalendarConfigSuccessResponse
    | GetGoogleCalendarConfigErrorResponse;

  return { response, data };
}
