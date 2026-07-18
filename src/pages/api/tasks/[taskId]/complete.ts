import { isUserAssignedToTask } from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { loadTaskFormFields } from "@/lib/taskFormFirestore";
import { validateFormAnswers } from "@/lib/taskFormValidation";
import type {
  CompleteTaskErrorResponse,
  CompleteTaskRequestBody,
  CompleteTaskSuccessResponse,
  UncompleteTaskErrorResponse,
  UncompleteTaskRequestBody,
  UncompleteTaskSuccessResponse,
} from "@/types/task";
import type { FirestoreUser } from "@/types/user";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

type CompleteTaskResponse =
  | CompleteTaskSuccessResponse
  | CompleteTaskErrorResponse;

type UncompleteTaskResponse =
  | UncompleteTaskSuccessResponse
  | UncompleteTaskErrorResponse;

type TaskCompletionResponse = CompleteTaskResponse | UncompleteTaskResponse;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TaskCompletionResponse>,
) {
  if (req.method === "POST") {
    return handleComplete(req, res);
  }

  if (req.method === "DELETE") {
    return handleUncomplete(req, res);
  }

  res.setHeader("Allow", "POST, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleComplete(
  req: NextApiRequest,
  res: NextApiResponse<CompleteTaskResponse>,
) {
  const taskId = typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";
  const { userId, answers } = req.body as Partial<CompleteTaskRequestBody>;

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

    const formFields = await loadTaskFormFields(db, taskId);
    const answersValidation = validateFormAnswers(formFields, answers);
    if (!answersValidation.ok) {
      return res.status(400).json({ error: answersValidation.error });
    }

    const userData = userDoc.data() as FirestoreUser;
    const completedAt = Timestamp.now();
    const batch = db.batch();

    batch.set(completionRef, {
      completedAt,
      completerName: userData.fullname,
      completerRank: userData.rank,
    });

    if (formFields.length > 0) {
      const submissionRef = taskRef.collection("submissions").doc(trimmedUserId);
      batch.set(submissionRef, {
        submittedAt: completedAt,
        completerName: userData.fullname,
        completerRank: userData.rank,
        answers: answersValidation.answers,
      });
    }

    await batch.commit();

    return res.status(201).json({
      completedAt: completedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Complete task failed:", error);
    return res.status(500).json({ error: "Complete task failed" });
  }
}

async function handleUncomplete(
  req: NextApiRequest,
  res: NextApiResponse<UncompleteTaskResponse>,
) {
  const taskId = typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";
  const { userId } = req.body as Partial<UncompleteTaskRequestBody>;

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

    if (!existingCompletion.exists) {
      return res.status(409).json({ error: "Task is not completed" });
    }

    await completionRef.delete();

    return res.status(200).json({ uncompleted: true });
  } catch (error) {
    console.error("Uncomplete task failed:", error);
    return res.status(500).json({ error: "Uncomplete task failed" });
  }
}
