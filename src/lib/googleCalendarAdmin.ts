import { google } from "googleapis";
import { PLATOONS } from "@/lib/platoons";
import type { Platoon } from "@/types/user";

interface GoogleServiceAccountKey {
  client_email: string;
  private_key: string;
}

function getServiceAccountCredentials(): GoogleServiceAccountKey {
  const key = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error("GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY is not set");
  }

  return JSON.parse(key) as GoogleServiceAccountKey;
}

export function getGoogleCalendarClient() {
  const { client_email, private_key } = getServiceAccountCredentials();

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  return google.calendar({ version: "v3", auth });
}

/**
 * GOOGLE_CALENDAR_IDS maps every platoon to its own calendar, e.g.
 * {"A":"a@group.calendar.google.com","B":"","C":"","D":"","E":""}
 *
 * A key that is missing, blank or not a string means that platoon has no
 * calendar connected yet, which the UI reports instead of showing a calendar.
 */
function getCalendarIdsByPlatoon(): Partial<Record<Platoon, string>> {
  const raw = process.env.GOOGLE_CALENDAR_IDS;
  if (!raw) {
    throw new Error("GOOGLE_CALENDAR_IDS is not set");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_CALENDAR_IDS is not valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("GOOGLE_CALENDAR_IDS must be a JSON object keyed by platoon");
  }

  const entries = parsed as Record<string, unknown>;
  const calendarIds: Partial<Record<Platoon, string>> = {};

  for (const platoon of PLATOONS) {
    const value = entries[platoon];
    if (typeof value === "string" && value.trim()) {
      calendarIds[platoon] = value.trim();
    }
  }

  return calendarIds;
}

/** The platoon's calendar id, or null when none is configured for it. */
export function getGoogleCalendarIdForPlatoon(platoon: Platoon): string | null {
  return getCalendarIdsByPlatoon()[platoon] ?? null;
}
