import {
  hasTaskAssignment,
  isUserAssignedToTask,
  normalizeTeamIdsOptional,
  normalizeUserIds,
} from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicTask } from "@/lib/taskMapper";
import {
  deleteTaskSubcollection,
  getTaskSubmissionCount,
  loadTaskFormFields,
  syncTaskFormFields,
} from "@/lib/taskFormFirestore";
import { deleteAllTaskMedia } from "@/lib/taskMediaStorage";
import { validateFormFieldInputs } from "@/lib/taskFormValidation";
import type {
  DeleteTaskErrorResponse,
  DeleteTaskRequestBody,
  DeleteTaskSuccessResponse,
  GetTaskErrorResponse,
  GetTaskSuccessResponse,
  TaskMedia,
  UpdateTaskErrorResponse,
  UpdateTaskRequestBody,
  UpdateTaskSuccessResponse,
} from "@/types/task";
import type { FirestoreTaskSubmission } from "@/types/taskForm";
import type { FirestoreUser } from "@/types/user";
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
    const db = getAdminFirestore();
    const taskDoc = await db.collection("tasks").doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskData = taskDoc.data()!;
    const assignedTeams = Array.isArray(taskData.assignedTeams)
      ? (taskData.assignedTeams as number[])
      : [];
    const assignedUsers = Array.isArray(taskData.assignedUsers)
      ? (taskData.assignedUsers as string[])
      : [];
    const creatorId =
      typeof taskData.creatorId === "string" ? taskData.creatorId.trim() : "";
    const isCreator = creatorId === userId;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(400).json({ error: "User not found" });
    }

    const userTeam = (userDoc.data() as FirestoreUser).team;
    const isAssignee = isUserAssignedToTask(
      userId,
      userTeam,
      assignedTeams,
      assignedUsers,
    );

    if (!isAssignee && !isCreator) {
      return res.status(403).json({ error: "User is not assigned to this task" });
    }

    const task = toPublicTask(taskDoc.id, taskData);
    if (!task) {
      return res.status(500).json({ error: "Task data is invalid" });
    }

    const formFields = await loadTaskFormFields(db, taskId);
    const hasFormFields = formFields.length > 0 || task.hasFormFields;
    const submissionCount =
      isCreator && hasFormFields
        ? await getTaskSubmissionCount(db, taskId)
        : undefined;

    const taskWithFormFields = {
      ...task,
      hasFormFields,
      formFields,
      ...(submissionCount !== undefined ? { submissionCount } : {}),
    };

    if (isCreator && !isAssignee) {
      return res.status(200).json({
        task: {
          ...taskWithFormFields,
          completed: false,
          completedAt: null,
          submission: null,
        },
      });
    }

    const completionDoc = await db
      .collection("tasks")
      .doc(taskId)
      .collection("completions")
      .doc(userId)
      .get();

    let submission = null;
    if (completionDoc.exists && formFields.length > 0) {
      const submissionDoc = await db
        .collection("tasks")
        .doc(taskId)
        .collection("submissions")
        .doc(userId)
        .get();

      if (submissionDoc.exists) {
        const submissionData = submissionDoc.data() as FirestoreTaskSubmission;
        submission = {
          submittedAt: (submissionData.submittedAt as Timestamp)
            .toDate()
            .toISOString(),
          completerName: submissionData.completerName,
          completerRank: submissionData.completerRank,
          answers: submissionData.answers ?? {},
        };
      }
    }

    return res.status(200).json({
      task: {
        ...taskWithFormFields,
        completed: completionDoc.exists,
        completedAt:
          completionDoc.exists && completionDoc.data()?.completedAt
            ? (completionDoc.data()!.completedAt as Timestamp)
                .toDate()
                .toISOString()
            : null,
        submission,
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
  const { userId, title, content, dueDate, assignedTeams, assignedUsers, formFields } =
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

  if (
    content !== undefined &&
    content !== null &&
    typeof content !== "string"
  ) {
    return res.status(400).json({ error: "Content must be a string" });
  }

  const trimmedContent = typeof content === "string" ? content.trim() : "";

  if (!isNonEmptyString(dueDate)) {
    return res.status(400).json({ error: "Due date is required" });
  }

  const normalizedTeams = normalizeTeamIdsOptional(assignedTeams);
  if (normalizedTeams === null) {
    return res
      .status(400)
      .json({ error: "Assigned teams must be a list of valid team numbers" });
  }

  const normalizedUsers = normalizeUserIds(assignedUsers ?? []);
  if (normalizedUsers === null) {
    return res
      .status(400)
      .json({ error: "Assigned users must be a list of valid user IDs" });
  }

  if (!hasTaskAssignment(normalizedTeams, normalizedUsers)) {
    return res.status(400).json({ error: "At least one assignee is required" });
  }

  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    return res.status(400).json({ error: "Invalid due date" });
  }

  const formFieldsValidation = validateFormFieldInputs(formFields);
  if (!formFieldsValidation.ok) {
    return res.status(400).json({ error: formFieldsValidation.error });
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

    await taskRef.update({
      title: title.trim(),
      content: trimmedContent,
      dueDate: Timestamp.fromDate(parsedDueDate),
      assignedTeams: normalizedTeams,
      assignedUsers: normalizedUsers,
      hasFormFields: formFieldsValidation.fields.length > 0,
    });

    await syncTaskFormFields(db, taskId, formFieldsValidation.fields);

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

    const taskMedia = Array.isArray(taskDoc.data()?.media)
      ? (taskDoc.data()!.media as TaskMedia[])
      : [];

    if (taskMedia.length > 0) {
      await deleteAllTaskMedia(taskId, taskMedia);
    }

    const completionsSnapshot = await taskRef.collection("completions").get();
    if (!completionsSnapshot.empty) {
      const batch = db.batch();
      completionsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    await deleteTaskSubcollection(db, taskRef, "formFields");
    await deleteTaskSubcollection(db, taskRef, "submissions");

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
