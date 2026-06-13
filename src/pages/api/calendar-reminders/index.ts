import { getAdminFirestore } from "@/lib/firebaseAdmin";
import {
  CALENDAR_REMINDERS_COLLECTION,
  toPublicCalendarReminder,
} from "@/lib/calendarReminderMapper";
import type {
  ListCalendarRemindersErrorResponse,
  ListCalendarRemindersSuccessResponse,
  PublicCalendarReminder,
} from "@/types/calendarReminder";
import type { NextApiRequest, NextApiResponse } from "next";

type ListCalendarRemindersResponse =
  | ListCalendarRemindersSuccessResponse
  | ListCalendarRemindersErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListCalendarRemindersResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const snapshot = await getAdminFirestore()
      .collection(CALENDAR_REMINDERS_COLLECTION)
      .get();

    const reminders = snapshot.docs
      .map((doc) => toPublicCalendarReminder(doc.id, doc.data()))
      .filter((reminder): reminder is PublicCalendarReminder => reminder !== null)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    return res.status(200).json({ reminders });
  } catch (error) {
    console.error("List calendar reminders failed:", error);
    return res.status(500).json({ error: "List calendar reminders failed" });
  }
}
