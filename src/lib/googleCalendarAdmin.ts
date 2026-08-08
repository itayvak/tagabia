import { google } from "googleapis";

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

export function getGoogleCalendarId(): string {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    throw new Error("GOOGLE_CALENDAR_ID is not set");
  }

  return calendarId;
}
