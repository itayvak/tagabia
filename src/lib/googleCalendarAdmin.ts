import { google } from "googleapis";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import {
  GOOGLE_CALENDAR_CONFIG_COLLECTION,
  GOOGLE_CALENDAR_CONFIG_DOC_ID,
  parseCalendarIds,
} from "@/lib/googleCalendarConfigMapper";
import type {
  FirestoreGoogleCalendarConfig,
  GoogleCalendarIdsByPlatoon,
} from "@/types/googleCalendar";
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
 * The per-platoon calendars live in Firestore and are edited on the developers
 * page. GOOGLE_CALENDAR_IDS — the JSON env var they used to live in, e.g.
 * {"A":"a@group.calendar.google.com","B":""} — is still read as a fallback so
 * deployments keep working until the config is saved once.
 *
 * A platoon that is missing or blank in both has no calendar connected yet,
 * which the UI reports instead of showing a calendar.
 */
function getCalendarIdsFromEnv(): GoogleCalendarIdsByPlatoon {
  const raw = process.env.GOOGLE_CALENDAR_IDS;
  if (!raw) {
    return {};
  }

  try {
    return parseCalendarIds(JSON.parse(raw));
  } catch {
    console.error("GOOGLE_CALENDAR_IDS is not valid JSON");
    return {};
  }
}

export async function getGoogleCalendarIdsByPlatoon(): Promise<GoogleCalendarIdsByPlatoon> {
  const doc = await getAdminFirestore()
    .collection(GOOGLE_CALENDAR_CONFIG_COLLECTION)
    .doc(GOOGLE_CALENDAR_CONFIG_DOC_ID)
    .get();

  if (!doc.exists) {
    return getCalendarIdsFromEnv();
  }

  // Once the config has been saved it is the only source of truth, so a
  // platoon cleared on the developers page stays cleared even if the old env
  // var still lists it.
  return parseCalendarIds(
    (doc.data() as Partial<FirestoreGoogleCalendarConfig> | undefined)
      ?.calendarIds,
  );
}

/** The platoon's calendar id, or null when none is configured for it. */
export async function getGoogleCalendarIdForPlatoon(
  platoon: Platoon,
): Promise<string | null> {
  return (await getGoogleCalendarIdsByPlatoon())[platoon] ?? null;
}
