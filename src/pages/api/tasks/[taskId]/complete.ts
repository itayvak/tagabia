import { isUserAssignedToTask } from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type {
  CompleteTaskErrorResponse,
  CompleteTaskRequestBody,
  CompleteTaskSuccessResponse,
} from "@/types/task";
import type { FirestoreUser } from "@/types/user";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

type CompleteTaskResponse =
  | CompleteTaskSuccessResponse
  | CompleteTaskErrorResponse;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CompleteTaskResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const taskId = typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";
  const { userId } = req.body as Partial<CompleteTaskRequestBody>;

  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  if (!isNonEmptyString(userId)) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const trimmedUserId = userId.trim();

  try {
    const db = getAdminFirestore();
    const taskRef = db.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    const assignedTeams = Array.isArray(taskDoc.data()?.assignedTeams)
      ? (taskDoc.data()!.assignedTeams as number[])
      : [];
    const assignedUsers = Array.isArray(taskDoc.data()?.assignedUsers)
      ? (taskDoc.data()!.assignedUsers as string[])
      : [];

    const userDoc = await db.collection("users").doc(trimmedUserId).get();
    if (!userDoc.exists) {
      return res.status(400).json({ error: "User not found" });
    }

    const userTeam = (userDoc.data() as FirestoreUser).team;
    if (
      !isUserAssignedToTask(
        trimmedUserId,
        userTeam,
        assignedTeams,
        assignedUsers,
      )
    ) {
      return res.status(403).json({ error: "User is not assigned to this task" });
    }

    const completionRef = taskRef.collection("completions").doc(trimmedUserId);
    const existingCompletion = await completionRef.get();

    if (existingCompletion.exists) {
      return res.status(409).json({ error: "Task already completed" });
    }

    const userData = userDoc.data() as FirestoreUser;
    const completedAt = Timestamp.now();
    await completionRef.set({
      completedAt,
      completerName: userData.fullname,
      completerRank: userData.rank,
    });

    return res.status(201).json({
      completedAt: completedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Complete task failed:", error);
    return res.status(500).json({ error: "Complete task failed" });
  }
}
