import { isAdminUser } from "@/lib/admin";
import {
  COURSE_CONFIG_COLLECTION,
  COURSE_CONFIG_DOC_ID,
  isValidDateKey,
  parseStoredWeeks,
  toPublicCourseConfig,
} from "@/lib/courseConfigMapper";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type {
  UpdateCourseConfigErrorResponse,
  UpdateCourseConfigRequest,
  UpdateCourseConfigSuccessResponse,
} from "@/types/courseConfig";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

type UpdateCourseConfigResponse =
  | UpdateCourseConfigSuccessResponse
  | UpdateCourseConfigErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateCourseConfigResponse>,
) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, startDate, weeks } = req.body as Partial<UpdateCourseConfigRequest>;

  if (typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!isAdminUser(userId.trim())) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (typeof startDate !== "string" || !isValidDateKey(startDate)) {
    return res.status(400).json({ error: "Start date is required" });
  }

  const parsedWeeks = parseStoredWeeks(weeks);
  if (!parsedWeeks) {
    return res.status(400).json({ error: "At least one week is required" });
  }

  try {
    const configRef = getAdminFirestore()
      .collection(COURSE_CONFIG_COLLECTION)
      .doc(COURSE_CONFIG_DOC_ID);

    const payload = {
      startDate,
      weeks: parsedWeeks,
      updatedAt: Timestamp.now(),
    };

    await configRef.set(payload, { merge: true });

    const config = toPublicCourseConfig(payload);
    if (!config) {
      return res.status(500).json({ error: "Update course config failed" });
    }

    return res.status(200).json({ config });
  } catch (error) {
    console.error("Update course config failed:", error);
    return res.status(500).json({ error: "Update course config failed" });
  }
}
