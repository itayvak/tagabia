import formidable from "formidable";
import fs from "fs/promises";
import { isUserAssignedToTask } from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { MAX_TASK_COMPLETION_MEDIA_FILES } from "@/lib/taskCompletionMedia";
import { loadTaskFormFields } from "@/lib/taskFormFirestore";
import {
  deleteAllTaskCompletionMedia,
  uploadTaskCompletionMedia,
} from "@/lib/taskMediaStorage";
import {
  isAllowedTaskMediaContentType,
  MAX_TASK_MEDIA_FILE_SIZE_BYTES,
  resolveTaskMediaContentType,
} from "@/lib/taskMediaValidation";
import { validateFormAnswers } from "@/lib/taskFormValidation";
import {
  normalizeCompletionFileUploadMax,
  type TaskMedia,
} from "@/types/task";
import type {
  CompleteTaskErrorResponse,
  CompleteTaskSuccessResponse,
  UncompleteTaskErrorResponse,
  UncompleteTaskRequestBody,
  UncompleteTaskSuccessResponse,
} from "@/types/task";
import type { FirestoreUser } from "@/types/user";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

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

function parseMultipartForm(req: NextApiRequest) {
  const form = formidable({
    maxFileSize: MAX_TASK_MEDIA_FILE_SIZE_BYTES,
    maxFiles: MAX_TASK_COMPLETION_MEDIA_FILES,
    multiples: true,
  });

  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      form.parse(req, (error, fields, files) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({ fields, files });
      });
    },
  );
}

function getFormFieldValue(
  fields: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = fields[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const first = value.find(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    return first?.trim() ?? null;
  }

  return null;
}

function getUploadedFiles(files: formidable.Files): formidable.File[] {
  const fileField = files.files ?? files.file;
  if (!fileField) {
    return [];
  }

  return Array.isArray(fileField) ? fileField : [fileField];
}

async function readJsonBody<T>(req: NextApiRequest): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
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

  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  let uploadedFiles: formidable.File[] = [];
  let uploadedMedia: TaskMedia[] = [];
  let uploadedMediaUserId: string | null = null;

  try {
    const { fields, files } = await parseMultipartForm(req);
    const userId = getFormFieldValue(fields, "userId");
    const answersValue = getFormFieldValue(fields, "answers");
    const answers = answersValue
      ? (JSON.parse(answersValue) as Record<string, string>)
      : undefined;

    if (!isNonEmptyString(userId)) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const trimmedUserId = userId.trim();
    uploadedFiles = getUploadedFiles(files);
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

    const allowCompletionFileUpload =
      taskDoc.data()?.allowCompletionFileUpload === true ||
      taskDoc.data()?.requireCompletionFileUpload === true;
    const requireCompletionFileUpload = taskDoc.data()?.requireCompletionFileUpload === true;
    const completionFileUploadMax = normalizeCompletionFileUploadMax(
      taskDoc.data()?.completionFileUploadMax,
    );

    if (!allowCompletionFileUpload && uploadedFiles.length > 0) {
      return res.status(400).json({ error: "Completion file uploads are not allowed" });
    }

    if (uploadedFiles.length > completionFileUploadMax) {
      return res.status(400).json({ error: "Maximum number of completion files reached" });
    }

    if (requireCompletionFileUpload && uploadedFiles.length === 0) {
      return res.status(400).json({ error: "Completion file is required" });
    }

    const userData = userDoc.data() as FirestoreUser;
    const completedAt = Timestamp.now();
    const batch = db.batch();

    batch.set(completionRef, {
      completedAt,
      completerName: userData.fullname,
      completerRank: userData.rank,
    });

    if (uploadedFiles.length > 0) {
      uploadedMediaUserId = trimmedUserId;
      uploadedMedia = await Promise.all(
        uploadedFiles.map(async (uploadedFile) => {
          const originalFilename = uploadedFile.originalFilename ?? "file";
          const contentType = resolveTaskMediaContentType(
            uploadedFile.mimetype,
            originalFilename,
          );

          if (!isAllowedTaskMediaContentType(contentType)) {
            throw new Error("File type is not allowed");
          }

          const buffer = await fs.readFile(uploadedFile.filepath);
          return uploadTaskCompletionMedia(taskId, trimmedUserId, {
            buffer,
            originalFilename,
            contentType,
            size: uploadedFile.size,
          });
        }),
      );
    }

    if (formFields.length > 0 || uploadedMedia.length > 0) {
      const submissionRef = taskRef.collection("submissions").doc(trimmedUserId);
      batch.set(submissionRef, {
        submittedAt: completedAt,
        completerName: userData.fullname,
        completerRank: userData.rank,
        answers: answersValidation.answers,
        media: uploadedMedia,
      });
    }

    await batch.commit();

    return res.status(201).json({
      completedAt: completedAt.toDate().toISOString(),
    });
  } catch (error) {
    if (uploadedMedia.length > 0 && uploadedMediaUserId) {
      await deleteAllTaskCompletionMedia(taskId, uploadedMediaUserId, uploadedMedia);
    }

    if (error instanceof Error && error.message === "File type is not allowed") {
      return res.status(400).json({ error: error.message });
    }
    if (
      error instanceof Error &&
      (error.message.includes("maxFileSize") || error.message.includes("exceeded"))
    ) {
      return res.status(400).json({ error: "File is too large" });
    }

    console.error("Complete task failed:", error);
    return res.status(500).json({ error: "Complete task failed" });
  } finally {
    await Promise.all(
      uploadedFiles.map((uploadedFile) =>
        uploadedFile.filepath
          ? fs.unlink(uploadedFile.filepath).catch(() => undefined)
          : Promise.resolve(undefined),
      ),
    );
  }
}

async function handleUncomplete(
  req: NextApiRequest,
  res: NextApiResponse<UncompleteTaskResponse>,
) {
  const taskId = typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";
  const { userId } = await readJsonBody<Partial<UncompleteTaskRequestBody>>(req);

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

    const submissionRef = taskRef.collection("submissions").doc(trimmedUserId);
    const submissionDoc = await submissionRef.get();
    const submissionMedia = Array.isArray(submissionDoc.data()?.media)
      ? (submissionDoc.data()!.media as TaskMedia[])
      : [];

    await completionRef.delete();
    if (submissionDoc.exists) {
      await submissionRef.delete();
    }
    if (submissionMedia.length > 0) {
      await deleteAllTaskCompletionMedia(taskId, trimmedUserId, submissionMedia);
    }

    return res.status(200).json({ uncompleted: true });
  } catch (error) {
    console.error("Uncomplete task failed:", error);
    return res.status(500).json({ error: "Uncomplete task failed" });
  }
}
