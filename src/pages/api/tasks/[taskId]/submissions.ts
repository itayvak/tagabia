import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { loadTaskFormFields } from "@/lib/taskFormFirestore";
import { canViewTaskManagement } from "@/lib/taskManagementAuth";
import type { FirestoreUser } from "@/types/user";
import type {
  FirestoreTaskSubmission,
  ListTaskSubmissionsErrorResponse,
  ListTaskSubmissionsSuccessResponse,
  TaskSubmissionEntry,
} from "@/types/taskForm";
import type { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

type ListTaskSubmissionsResponse =
  | ListTaskSubmissionsSuccessResponse
  | ListTaskSubmissionsErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListTaskSubmissionsResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const taskId =
    typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";
  const userId =
    typeof req.query.creatorId === "string" ? req.query.creatorId.trim() : "";

  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  if (!userId) {
    return res.status(400).json({ error: "Creator ID is required" });
  }

  try {
    const db = getAdminFirestore();
    const taskRef = db.collection("tasks").doc(taskId);
    const [taskDoc, userDoc] = await Promise.all([
      taskRef.get(),
      db.collection("users").doc(userId).get(),
    ]);

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (!userDoc.exists) {
      return res.status(400).json({ error: "User not found" });
    }

    const taskData = taskDoc.data()!;
    const userData = userDoc.data() as FirestoreUser;

    if (
      !canViewTaskManagement(
        userId,
        userData.team,
        userData.role,
        taskData,
        userData.platoon,
      )
    ) {
      return res.status(403).json({ error: "User is not the task creator" });
    }

    const [formFields, submissionsSnapshot] = await Promise.all([
      loadTaskFormFields(db, taskId),
      taskRef.collection("submissions").get(),
    ]);

    if (formFields.length === 0) {
      return res.status(400).json({ error: "Task has no form fields" });
    }

    const submissions: TaskSubmissionEntry[] = submissionsSnapshot.docs
      .map((submissionDoc) => {
        const data = submissionDoc.data() as Partial<FirestoreTaskSubmission>;
        const submittedAt = data.submittedAt as Timestamp | undefined;

        if (!submittedAt || typeof data.completerName !== "string") {
          return null;
        }

        return {
          userId: submissionDoc.id,
          submittedAt: submittedAt.toDate().toISOString(),
          completerName: data.completerName,
          completerRank:
            typeof data.completerRank === "string" ? data.completerRank : "",
          answers:
            data.answers && typeof data.answers === "object"
              ? Object.fromEntries(
                  Object.entries(data.answers).filter(
                    (entry): entry is [string, string] =>
                      typeof entry[0] === "string" && typeof entry[1] === "string",
                  ),
                )
              : {},
        };
      })
      .filter((entry): entry is TaskSubmissionEntry => entry !== null)
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );

    return res.status(200).json({ formFields, submissions });
  } catch (error) {
    console.error("List task submissions failed:", error);
    return res.status(500).json({ error: "List submissions failed" });
  }
}
