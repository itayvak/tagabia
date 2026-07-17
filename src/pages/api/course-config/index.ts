import {
  COURSE_CONFIG_COLLECTION,
  COURSE_CONFIG_DOC_ID,
  toPublicCourseConfig,
} from "@/lib/courseConfigMapper";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type {
  GetCourseConfigErrorResponse,
  GetCourseConfigSuccessResponse,
} from "@/types/courseConfig";
import type { NextApiRequest, NextApiResponse } from "next";

type GetCourseConfigResponse =
  | GetCourseConfigSuccessResponse
  | GetCourseConfigErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetCourseConfigResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const doc = await getAdminFirestore()
      .collection(COURSE_CONFIG_COLLECTION)
      .doc(COURSE_CONFIG_DOC_ID)
      .get();

    if (!doc.exists) {
      return res.status(200).json({ config: null });
    }

    const config = toPublicCourseConfig(doc.data() ?? {});
    return res.status(200).json({ config });
  } catch (error) {
    console.error("Get course config failed:", error);
    return res.status(500).json({ error: "Get course config failed" });
  }
}
