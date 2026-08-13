export interface PublicGoogleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  colorId?: string;
}

export interface ListGoogleCalendarEventsSuccessResponse {
  events: PublicGoogleCalendarEvent[];
}

/** Distinguishes "this platoon has no calendar" from an actual failure. */
export type ListGoogleCalendarEventsErrorCode = "platoonCalendarNotConnected";

export interface ListGoogleCalendarEventsErrorResponse {
  error: string;
  code?: ListGoogleCalendarEventsErrorCode;
}
