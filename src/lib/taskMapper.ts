import { normalizeTaskCategory } from "@/lib/taskCategory";
import type { FirestoreTask, PublicTask, TaskMedia } from "@/types/task";
import type { Timestamp } from "firebase-admin/firestore";

function parseTaskMedia(value: unknown): TaskMedia[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is TaskMedia => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const media = item as Partial<TaskMedia>;
    return (
      typeof media.id === "string" &&
      media.id.trim().length > 0 &&
      typeof media.name === "string" &&
      typeof media.url === "string" &&
      typeof media.contentType === "string" &&
      typeof media.size === "number" &&
      Number.isFinite(media.size)
    );
  });
}

export function toPublicTask(
  id: string,
  data: FirebaseFirestore.DocumentData,
): PublicTask | null {
  const task = data as Partial<FirestoreTask>;

  if (
    !task.title ||
    !task.creatorName ||
    !task.creatorRank ||
    !task.creatorRole ||
    !task.dueDate
  ) {
    return null;
  }

  const dueDate = task.dueDate as Timestamp;

  return {
    id,
    title: task.title,
    content: task.content ?? "",
    category: normalizeTaskCategory(task.category),
    creatorId: task.creatorId ?? "",
    creatorName: task.creatorName,
    creatorRank: task.creatorRank,
    creatorRole: task.creatorRole,
    dueDate: dueDate.toDate().toISOString(),
    assignedTeams: Array.isArray(task.assignedTeams)
      ? task.assignedTeams.filter(
          (team): team is number =>
            typeof team === "number" && Number.isInteger(team),
        )
      : [],
    assignedUsers: Array.isArray(task.assignedUsers)
      ? task.assignedUsers.filter(
          (userId): userId is string =>
            typeof userId === "string" && userId.trim().length > 0,
        )
      : [],
    hasFormFields: task.hasFormFields === true,
    requiresCampusSubmission: task.requiresCampusSubmission === true,
    media: parseTaskMedia(task.media),
  };
}
