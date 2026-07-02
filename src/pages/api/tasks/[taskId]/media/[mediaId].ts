import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import {
  isNonEmptyStringValue,
  verifyTaskCreator,
} from "@/lib/taskMediaAuth";
import { deleteTaskMediaFile } from "@/lib/taskMediaStorage";
import type { TaskMedia } from "@/types/task";

interface DeleteTaskMediaSuccessResponse {
  mediaId: string;
}

interface DeleteTaskMediaErrorResponse {
  error: string;
}

type DeleteTaskMediaResponse =
  | DeleteTaskMediaSuccessResponse
  | DeleteTaskMediaErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteTaskMediaResponse>,
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const taskId =
    typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";
  const mediaId =
    typeof req.query.mediaId === "string" ? req.query.mediaId.trim() : "";
  const { userId } = req.body as { userId?: unknown };

  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  if (!mediaId) {
    return res.status(400).json({ error: "Media ID is required" });
  }

  if (!isNonEmptyStringValue(userId)) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const creatorCheck = await verifyTaskCreator(taskId, userId);
    if (!creatorCheck.ok) {
      return res.status(creatorCheck.status).json({ error: creatorCheck.error });
    }

    const mediaToDelete = creatorCheck.media.find((media) => media.id === mediaId);
    if (!mediaToDelete) {
      return res.status(404).json({ error: "Media not found" });
    }

    await deleteTaskMediaFile(taskId, mediaToDelete.id, mediaToDelete.name);

    const remainingMedia = creatorCheck.media.filter(
      (media): media is TaskMedia => media.id !== mediaId,
    );

    const db = getAdminFirestore();
    await db.collection("tasks").doc(taskId).update({ media: remainingMedia });

    return res.status(200).json({ mediaId });
  } catch (error) {
    console.error("Delete task media failed:", error);
    return res.status(500).json({ error: "Delete task media failed" });
  }
}
