import { PLATOONS } from "@/lib/platoons";
import type { GoogleCalendarIdsByPlatoon } from "@/types/googleCalendar";

export const GOOGLE_CALENDAR_CONFIG_COLLECTION = "googleCalendarConfig";
export const GOOGLE_CALENDAR_CONFIG_DOC_ID = "main";

// Calendar addresses are mail-like ("...@group.calendar.google.com" for shared
// calendars, a plain Gmail address for a personal one), so this only rules out
// values that cannot be either.
const CALENDAR_ID_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidCalendarId(value: string): boolean {
  return CALENDAR_ID_PATTERN.test(value);
}

/**
 * Keeps only the known platoons with a non-empty string value, so a stored
 * document with stale or hand-edited keys cannot leak into the app.
 */
export function parseCalendarIds(value: unknown): GoogleCalendarIdsByPlatoon {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const entries = value as Record<string, unknown>;
  const calendarIds: GoogleCalendarIdsByPlatoon = {};

  for (const platoon of PLATOONS) {
    const entry = entries[platoon];
    if (typeof entry === "string" && entry.trim()) {
      calendarIds[platoon] = entry.trim();
    }
  }

  return calendarIds;
}
