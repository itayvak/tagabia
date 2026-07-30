import {
  hasTaskAssignment,
  normalizeTeamIdsOptional,
  normalizeUserIds,
} from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { isTaskCategory } from "@/lib/taskCategory";
import { syncTaskFormFields } from "@/lib/taskFormFirestore";
import { validateFormFieldInputs } from "@/lib/taskFormValidation";
import { normalizeCompletionFileUploadMax } from "@/types/task";
import type {
  CreateTaskErrorResponse,
  CreateTaskRequestBody,
  CreateTaskSuccessResponse,
} from "@/types/task";
import type { FirestoreUser } from "@/types/user";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

type CreateTaskResponse = CreateTaskSuccessResponse | CreateTaskErrorResponse;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeCompletionUploadOptions(
  allowCompletionFileUpload: unknown,
  requireCompletionFileUpload: unknown,
  completionFileUploadMax: unknown,
) {
  const allowUploads = allowCompletionFileUpload === true;
  return {
    allowCompletionFileUpload: allowUploads,
    requireCompletionFileUpload: allowUploads && requireCompletionFileUpload === true,
    completionFileUploadMax: allowUploads
      ? normalizeCompletionFileUploadMax(completionFileUploadMax)
      : undefined,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateTaskResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    title,
    content,
    category,
    creatorId,
    dueDate,
    assignedTeams,
    assignedUsers,
    formFields,
    allowCompletionFileUpload,
    requireCompletionFileUpload,
    completionFileUploadMax,
    requiresCampusSubmission,
  } = req.body as Partial<CreateTaskRequestBody>;

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

  if (!isNonEmptyString(creatorId)) {
    return res.status(400).json({ error: "Creator ID is required" });
  }

  if (!isNonEmptyString(dueDate)) {
    return res.status(400).json({ error: "Due date is required" });
  }

  if (!isTaskCategory(category)) {
    return res.status(400).json({ error: "Invalid task category" });
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

  const completionUploadOptions = normalizeCompletionUploadOptions(
    allowCompletionFileUpload,
    requireCompletionFileUpload,
    completionFileUploadMax,
  );

  try {
    const db = getAdminFirestore();
    const trimmedCreatorId = creatorId.trim();
    const creatorRef = db.collection("users").doc(trimmedCreatorId);
    const creatorDoc = await creatorRef.get();

    if (!creatorDoc.exists) {
      return res.status(400).json({ error: "Creator not found" });
    }

    const creatorData = creatorDoc.data() as FirestoreUser;

    const taskRef = await db.collection("tasks").add({
      title: title.trim(),
      content: trimmedContent,
      category,
      creatorId: trimmedCreatorId,
      creatorName: creatorData.fullname,
      creatorRank: creatorData.rank,
      creatorRole: creatorData.role,
      creatorPlatoon: creatorData.platoon,
      dueDate: Timestamp.fromDate(parsedDueDate),
      assignedTeams: normalizedTeams,
      assignedUsers: normalizedUsers,
      hasFormFields: formFieldsValidation.fields.length > 0,
      allowCompletionFileUpload: completionUploadOptions.allowCompletionFileUpload,
      requireCompletionFileUpload: completionUploadOptions.requireCompletionFileUpload,
      completionFileUploadMax: completionUploadOptions.completionFileUploadMax,
      requiresCampusSubmission: requiresCampusSubmission === true,
    });

    if (formFieldsValidation.fields.length > 0) {
      await syncTaskFormFields(db, taskRef.id, formFieldsValidation.fields);
    }

    return res.status(201).json({ taskId: taskRef.id });
  } catch (error) {
    console.error("Create task failed:", error);
    return res.status(500).json({ error: "Create task failed" });
  }
}
