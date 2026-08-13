import type { Timestamp } from "firebase-admin/firestore";
import type { Platoon } from "@/types/user";

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

/**
 * One calendar address per platoon, e.g.
 * { A: "a@group.calendar.google.com", B: "" }. A missing or blank entry means
 * that platoon has no calendar connected yet.
 */
export type GoogleCalendarIdsByPlatoon = Partial<Record<Platoon, string>>;

export interface FirestoreGoogleCalendarConfig {
  calendarIds: GoogleCalendarIdsByPlatoon;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface PublicGoogleCalendarConfig {
  calendarIds: GoogleCalendarIdsByPlatoon;
}

export interface GetGoogleCalendarConfigSuccessResponse {
  config: PublicGoogleCalendarConfig;
}

export interface GetGoogleCalendarConfigErrorResponse {
  error: string;
}

export interface UpdateGoogleCalendarConfigRequest {
  userId: string;
  calendarIds: GoogleCalendarIdsByPlatoon;
}

export interface UpdateGoogleCalendarConfigSuccessResponse {
  config: PublicGoogleCalendarConfig;
}

export interface UpdateGoogleCalendarConfigErrorResponse {
  error: string;
}
