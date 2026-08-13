import { Timestamp } from "firebase-admin/firestore";
import { canAccessAdminByUserId } from "@/lib/adminAccess";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getGoogleCalendarIdsByPlatoon } from "@/lib/googleCalendarAdmin";
import {
  GOOGLE_CALENDAR_CONFIG_COLLECTION,
  GOOGLE_CALENDAR_CONFIG_DOC_ID,
  isValidCalendarId,
} from "@/lib/googleCalendarConfigMapper";
import { PLATOONS } from "@/lib/platoons";
import type {
  GetGoogleCalendarConfigErrorResponse,
  GetGoogleCalendarConfigSuccessResponse,
  GoogleCalendarIdsByPlatoon,
  UpdateGoogleCalendarConfigErrorResponse,
  UpdateGoogleCalendarConfigRequest,
  UpdateGoogleCalendarConfigSuccessResponse,
} from "@/types/googleCalendar";
import type { NextApiRequest, NextApiResponse } from "next";

type GoogleCalendarConfigResponse =
  | GetGoogleCalendarConfigSuccessResponse
  | GetGoogleCalendarConfigErrorResponse
  | UpdateGoogleCalendarConfigSuccessResponse
  | UpdateGoogleCalendarConfigErrorResponse;

/**
 * Blank entries are dropped rather than stored, so "no calendar for this
 * platoon" has one representation. Returns null on the first invalid address.
 */
function parseSubmittedCalendarIds(
  value: unknown,
): GoogleCalendarIdsByPlatoon | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const entries = value as Record<string, unknown>;
  const calendarIds: GoogleCalendarIdsByPlatoon = {};

  for (const platoon of PLATOONS) {
    const entry = entries[platoon];
    if (entry === undefined || entry === null || entry === "") {
      continue;
    }

    if (typeof entry !== "string") {
      return null;
    }

    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }

    if (!isValidCalendarId(trimmed)) {
      return null;
    }

    calendarIds[platoon] = trimmed;
  }

  return calendarIds;
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<GoogleCalendarConfigResponse>,
) {
  const { userId } = req.query;

  if (typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!(await canAccessAdminByUserId(userId.trim()))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const calendarIds = await getGoogleCalendarIdsByPlatoon();
    return res.status(200).json({ config: { calendarIds } });
  } catch (error) {
    console.error("Get google calendar config failed:", error);
    return res.status(500).json({ error: "Get google calendar config failed" });
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<GoogleCalendarConfigResponse>,
) {
  const { userId, calendarIds } =
    req.body as Partial<UpdateGoogleCalendarConfigRequest>;

  if (typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!(await canAccessAdminByUserId(userId.trim()))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const parsed = parseSubmittedCalendarIds(calendarIds);
  if (!parsed) {
    return res.status(400).json({ error: "Invalid calendar address" });
  }

  try {
    await getAdminFirestore()
      .collection(GOOGLE_CALENDAR_CONFIG_COLLECTION)
      .doc(GOOGLE_CALENDAR_CONFIG_DOC_ID)
      // Replaces the document instead of merging: a platoon cleared in the form
      // has to disappear from the stored map, not survive as a stale key.
      .set({
        calendarIds: parsed,
        updatedAt: Timestamp.now(),
        updatedBy: userId.trim(),
      });

    return res.status(200).json({ config: { calendarIds: parsed } });
  } catch (error) {
    console.error("Update google calendar config failed:", error);
    return res
      .status(500)
      .json({ error: "Update google calendar config failed" });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GoogleCalendarConfigResponse>,
) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }

  if (req.method === "PUT") {
    return handlePut(req, res);
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
