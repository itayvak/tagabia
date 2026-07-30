import {
  getGoogleCalendarClient,
  getGoogleCalendarId,
} from "@/lib/googleCalendarAdmin";
import type {
  ListGoogleCalendarEventsErrorResponse,
  ListGoogleCalendarEventsSuccessResponse,
  PublicGoogleCalendarEvent,
} from "@/types/googleCalendar";
import type { NextApiRequest, NextApiResponse } from "next";

type ListGoogleCalendarEventsResponse =
  | ListGoogleCalendarEventsSuccessResponse
  | ListGoogleCalendarEventsErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListGoogleCalendarEventsResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const calendar = getGoogleCalendarClient();
    const calendarId = getGoogleCalendarId();

    // Start from today rather than the past: a dense calendar would otherwise
    // fill the result cap with old events and never reach upcoming ones.
    const timeMin = new Date();
    timeMin.setHours(0, 0, 0, 0);
    const timeMax = new Date(timeMin);
    timeMax.setDate(timeMax.getDate() + 30);

    const { data } = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    const events: PublicGoogleCalendarEvent[] = (data.items ?? [])
      .filter((event) => event.status !== "cancelled")
      .map((event) => {
        const isAllDay = Boolean(event.start?.date && !event.start?.dateTime);

        return {
          id: event.id ?? "",
          title: event.summary ?? "(ללא כותרת)",
          start: event.start?.dateTime ?? event.start?.date ?? "",
          end: event.end?.dateTime ?? event.end?.date ?? "",
          allDay: isAllDay,
          location: event.location ?? undefined,
          colorId: event.colorId ?? undefined,
        };
      })
      .filter((event) => event.id && event.start && event.end);

    return res.status(200).json({ events });
  } catch (error) {
    console.error("List calendar events failed:", error);
    return res.status(500).json({ error: "List calendar events failed" });
  }
}
