import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { canCreateTasks } from "@/lib/roles";
import type { TaskMedia } from "@/types/task";
import type { FirestoreUser } from "@/types/user";

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
  const trimmedUserId = userId.trim();
  const [taskDoc, userDoc] = await Promise.all([
    db.collection("tasks").doc(taskId).get(),
    db.collection("users").doc(trimmedUserId).get(),
  ]);

  if (!taskDoc.exists) {
    return { ok: false, status: 404, error: "Task not found" };
  }

  if (!userDoc.exists) {
    return { ok: false, status: 400, error: "User not found" };
  }

  if (!canCreateTasks((userDoc.data() as FirestoreUser).role)) {
    return { ok: false, status: 403, error: "Task access is read-only" };
  }

  const taskData = taskDoc.data()!;
  if (taskData.creatorId !== trimmedUserId) {
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
