import { normalizeTeamIds } from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateTaskResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, content, creatorId, dueDate, assignedTeams } =
    req.body as Partial<CreateTaskRequestBody>;

  if (!isNonEmptyString(title)) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!isNonEmptyString(content)) {
    return res.status(400).json({ error: "Content is required" });
  }

  if (!isNonEmptyString(creatorId)) {
    return res.status(400).json({ error: "Creator ID is required" });
  }

  if (!isNonEmptyString(dueDate)) {
    return res.status(400).json({ error: "Due date is required" });
  }

  const normalizedTeams = normalizeTeamIds(assignedTeams);
  if (!normalizedTeams) {
    return res
      .status(400)
      .json({ error: "Assigned teams must be a list of valid team numbers" });
  }

  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    return res.status(400).json({ error: "Invalid due date" });
  }

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
      content: content.trim(),
      creatorId: trimmedCreatorId,
      creatorName: creatorData.fullname,
      creatorRank: creatorData.rank,
      creatorRole: creatorData.role,
      dueDate: Timestamp.fromDate(parsedDueDate),
      assignedTeams: normalizedTeams,
    });

    return res.status(201).json({ taskId: taskRef.id });
  } catch (error) {
    console.error("Create task failed:", error);
    return res.status(500).json({ error: "Create task failed" });
  }
}
