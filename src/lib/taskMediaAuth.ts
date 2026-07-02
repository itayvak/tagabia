import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type { TaskMedia } from "@/types/task";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function verifyTaskCreator(
  taskId: string,
  userId: string,
): Promise<
  | { ok: true; media: TaskMedia[] }
  | { ok: false; status: number; error: string }
> {
  const db = getAdminFirestore();
  const taskDoc = await db.collection("tasks").doc(taskId).get();

  if (!taskDoc.exists) {
    return { ok: false, status: 404, error: "Task not found" };
  }

  const taskData = taskDoc.data()!;
  if (taskData.creatorId !== userId.trim()) {
    return { ok: false, status: 403, error: "User is not the task creator" };
  }

  const media = Array.isArray(taskData.media) ? (taskData.media as TaskMedia[]) : [];

  return { ok: true, media };
}

export function getFormFieldValue(
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

export function isNonEmptyStringValue(value: unknown): value is string {
  return isNonEmptyString(value);
}
