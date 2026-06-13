import { getCalendarDateKey } from "@/lib/taskDate";
import type {
  FirestoreCalendarReminder,
  PublicCalendarReminder,
} from "@/types/calendarReminder";
import type { Timestamp } from "firebase-admin/firestore";

export const CALENDAR_REMINDERS_COLLECTION = "calendarReminders";

function parseReminderDate(value: unknown): Date | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return (value as Timestamp).toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

export function toPublicCalendarReminder(
  id: string,
  data: FirebaseFirestore.DocumentData,
): PublicCalendarReminder | null {
  const reminder = data as Partial<FirestoreCalendarReminder>;
  const parsedDate = parseReminderDate(reminder.date);

  if (!parsedDate || typeof reminder.text !== "string" || !reminder.text.trim()) {
    return null;
  }

  return {
    id,
    date: parsedDate.toISOString(),
    dateKey: getCalendarDateKey(parsedDate),
    text: reminder.text.trim(),
  };
}
