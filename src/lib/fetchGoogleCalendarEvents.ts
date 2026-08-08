import type {
  ListGoogleCalendarEventsErrorResponse,
  ListGoogleCalendarEventsSuccessResponse,
} from "@/types/googleCalendar";

export async function fetchGoogleCalendarEvents() {
  const response = await fetch("/api/google-calendar/events");

  const data = (await response.json()) as
    | ListGoogleCalendarEventsSuccessResponse
    | ListGoogleCalendarEventsErrorResponse;

  return { response, data };
}
