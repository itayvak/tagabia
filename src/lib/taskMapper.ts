import type { FirestoreTask, PublicTask } from "@/types/task";
import type { Timestamp } from "firebase-admin/firestore";

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
  };
}
