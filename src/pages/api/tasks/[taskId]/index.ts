import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicTask } from "@/lib/taskMapper";
import type {
  DeleteTaskErrorResponse,
  DeleteTaskRequestBody,
  DeleteTaskSuccessResponse,
  GetTaskErrorResponse,
  GetTaskSuccessResponse,
  UpdateTaskErrorResponse,
  UpdateTaskRequestBody,
  UpdateTaskSuccessResponse,
} from "@/types/task";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

type TaskResponse =
  | GetTaskSuccessResponse
  | GetTaskErrorResponse
  | UpdateTaskSuccessResponse
  | UpdateTaskErrorResponse
  | DeleteTaskSuccessResponse
  | DeleteTaskErrorResponse;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<GetTaskSuccessResponse | GetTaskErrorResponse>,
) {
  const taskId =
    typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";
  const userId =
    typeof req.query.userId === "string" ? req.query.userId.trim() : "";

  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const taskDoc = await getAdminFirestore()
      .collection("tasks")
      .doc(taskId)
      .get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    const assignees = taskDoc.data()?.assignees;
    if (!Array.isArray(assignees) || !assignees.includes(userId)) {
      return res.status(403).json({ error: "User is not assigned to this task" });
    }

    const task = toPublicTask(taskDoc.id, taskDoc.data()!);
    if (!task) {
      return res.status(500).json({ error: "Task data is invalid" });
    }

    const completionDoc = await getAdminFirestore()
      .collection("tasks")
      .doc(taskId)
      .collection("completions")
      .doc(userId)
      .get();

    return res.status(200).json({
      task: {
        ...task,
        completed: completionDoc.exists,
        completedAt:
          completionDoc.exists && completionDoc.data()?.completedAt
            ? (completionDoc.data()!.completedAt as Timestamp)
                .toDate()
                .toISOString()
            : null,
      },
    });
  } catch (error) {
    console.error("Get task failed:", error);
    return res.status(500).json({ error: "Get task failed" });
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<UpdateTaskSuccessResponse | UpdateTaskErrorResponse>,
) {
  const taskId =
    typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";
  const { userId, title, content, dueDate, assignees } =
    req.body as Partial<UpdateTaskRequestBody>;

  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  if (!isNonEmptyString(userId)) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!isNonEmptyString(title)) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!isNonEmptyString(content)) {
    return res.status(400).json({ error: "Content is required" });
  }

  if (!isNonEmptyString(dueDate)) {
    return res.status(400).json({ error: "Due date is required" });
  }

  if (!isStringArray(assignees)) {
    return res.status(400).json({ error: "Assignees must be a list of user IDs" });
  }

  if (assignees.length === 0) {
    return res.status(400).json({ error: "At least one assignee is required" });
  }

  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    return res.status(400).json({ error: "Invalid due date" });
  }

  try {
    const db = getAdminFirestore();
    const taskRef = db.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    const trimmedUserId = userId.trim();
    if (taskDoc.data()?.creatorId !== trimmedUserId) {
      return res.status(403).json({ error: "User is not the task creator" });
    }

    const uniqueAssigneeIds = [...new Set(assignees.map((id) => id.trim()))];
    const assigneeDocs = await db.getAll(
      ...uniqueAssigneeIds.map((id) => db.collection("users").doc(id)),
    );

    if (assigneeDocs.some((doc) => !doc.exists)) {
      return res.status(400).json({ error: "One or more assignees not found" });
    }

    await taskRef.update({
      title: title.trim(),
      content: content.trim(),
      dueDate: Timestamp.fromDate(parsedDueDate),
      assignees: uniqueAssigneeIds,
    });

    return res.status(200).json({ taskId });
  } catch (error) {
    console.error("Update task failed:", error);
    return res.status(500).json({ error: "Update task failed" });
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<DeleteTaskSuccessResponse | DeleteTaskErrorResponse>,
) {
  const taskId =
    typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";
  const { userId } = req.body as Partial<DeleteTaskRequestBody>;

  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  if (!isNonEmptyString(userId)) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const db = getAdminFirestore();
    const taskRef = db.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    const trimmedUserId = userId.trim();
    if (taskDoc.data()?.creatorId !== trimmedUserId) {
      return res.status(403).json({ error: "User is not the task creator" });
    }

    const completionsSnapshot = await taskRef.collection("completions").get();
    if (!completionsSnapshot.empty) {
      const batch = db.batch();
      completionsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    await taskRef.delete();

    return res.status(200).json({ taskId });
  } catch (error) {
    console.error("Delete task failed:", error);
    return res.status(500).json({ error: "Delete task failed" });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TaskResponse>,
) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }

  if (req.method === "PUT") {
    return handlePut(req, res);
  }

  if (req.method === "DELETE") {
    return handleDelete(req, res);
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
