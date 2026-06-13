import type { Timestamp } from "firebase-admin/firestore";

export interface FirestoreCalendarReminder {
  date: Timestamp;
  text: string;
}

export interface PublicCalendarReminder {
  id: string;
  date: string;
  dateKey: string;
  text: string;
}

export interface ListCalendarRemindersSuccessResponse {
  reminders: PublicCalendarReminder[];
}

export interface ListCalendarRemindersErrorResponse {
  error: string;
}
