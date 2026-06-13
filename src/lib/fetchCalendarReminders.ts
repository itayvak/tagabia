import type {
  ListCalendarRemindersErrorResponse,
  ListCalendarRemindersSuccessResponse,
} from "@/types/calendarReminder";

export async function fetchCalendarReminders() {
  const response = await fetch("/api/calendar-reminders");

  const data = (await response.json()) as
    | ListCalendarRemindersSuccessResponse
    | ListCalendarRemindersErrorResponse;

  if (!response.ok) {
    const { error } = data as ListCalendarRemindersErrorResponse;
    return { response, reminders: [], error };
  }

  return {
    response,
    reminders: (data as ListCalendarRemindersSuccessResponse).reminders,
    error: undefined,
  };
}
