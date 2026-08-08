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

export interface ListGoogleCalendarEventsErrorResponse {
  error: string;
}
