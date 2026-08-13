import type {
  ListGoogleCalendarEventsErrorResponse,
  ListGoogleCalendarEventsSuccessResponse,
} from "@/types/googleCalendar";

export async function fetchGoogleCalendarEvents(userId: string) {
  const response = await fetch(
    `/api/google-calendar/events?userId=${encodeURIComponent(userId)}`,
  );

  const data = (await response.json()) as
    | ListGoogleCalendarEventsSuccessResponse
    | ListGoogleCalendarEventsErrorResponse;

  return { response, data };
}
