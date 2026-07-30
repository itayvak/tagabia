import { Timestamp } from "firebase-admin/firestore";
import { canAccessAdminByUserId } from "@/lib/adminAccess";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicWorkEnvironmentFile } from "@/lib/workEnvironmentFileMapper";
import {
  isTrainingFileKey,
  isWorkEnvironmentFileKey,
} from "@/types/workEnvironment";
import type {
  FirestoreWorkEnvironmentFile,
  UpdateWorkEnvironmentFileTitleErrorResponse,
  UpdateWorkEnvironmentFileTitleRequestBody,
  UpdateWorkEnvironmentFileTitleSuccessResponse,
} from "@/types/workEnvironment";
import type { NextApiRequest, NextApiResponse } from "next";

type UpdateWorkEnvironmentFileTitleResponse =
  | UpdateWorkEnvironmentFileTitleSuccessResponse
  | UpdateWorkEnvironmentFileTitleErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateWorkEnvironmentFileTitleResponse>,
) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const fileKeyParam =
    typeof req.query.fileKey === "string" ? req.query.fileKey.trim() : "";

  if (
    !isWorkEnvironmentFileKey(fileKeyParam) ||
    !isTrainingFileKey(fileKeyParam)
  ) {
    return res
      .status(400)
      .json({ error: "Title editing is not supported for this file" });
  }

  const fileKey = fileKeyParam;
  const { userId, title } =
    req.body as Partial<UpdateWorkEnvironmentFileTitleRequestBody>;

  if (typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (typeof title !== "string") {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!(await canAccessAdminByUserId(userId.trim()))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const db = getAdminFirestore();
    const docRef = db.collection("workEnvironmentFiles").doc(fileKey);
    await docRef.set(
      {
        title: title.trim(),
        updatedAt: Timestamp.now(),
        updatedBy: userId.trim(),
      },
      { merge: true },
    );

    const updatedDoc = await docRef.get();
    const file = toPublicWorkEnvironmentFile(
      fileKey,
      updatedDoc.data() as FirestoreWorkEnvironmentFile | undefined,
    );

    return res.status(200).json({ file });
  } catch (error) {
    console.error("Update work environment file title failed:", error);
    return res
      .status(500)
      .json({ error: "Update work environment file title failed" });
  }
}
