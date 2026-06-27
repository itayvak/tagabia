import { getTaskAssignees } from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { mergeTaskSnapshotDocs } from "@/lib/mergeTaskSnapshots";
import { toPublicTask } from "@/lib/taskMapper";
import type {
  CalendarTask,
  ListCalendarTasksErrorResponse,
  ListCalendarTasksSuccessResponse,
} from "@/types/task";
import type { FirestoreUser } from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";
import { Timestamp } from "firebase-admin/firestore";

type ListCalendarTasksResponse =
  | ListCalendarTasksSuccessResponse
  | ListCalendarTasksErrorResponse;

function parseBooleanQuery(value: unknown): boolean {
  return value === "true" || value === "1";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListCalendarTasksResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId =
    typeof req.query.userId === "string" ? req.query.userId.trim() : "";
  const includeCreated = parseBooleanQuery(req.query.includeCreated);

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(400).json({ error: "User not found" });
    }

    const userTeam = (userDoc.data() as FirestoreUser).team;
    const [byTeamSnapshot, byUserSnapshot] = await Promise.all([
      db
        .collection("tasks")
        .where("assignedTeams", "array-contains", userTeam)
        .get(),
      db
        .collection("tasks")
        .where("assignedUsers", "array-contains", userId)
        .get(),
    ]);

    const assignedDocs = mergeTaskSnapshotDocs(byTeamSnapshot, byUserSnapshot);

    const completionRefs = assignedDocs.map((doc) =>
      db.collection("tasks").doc(doc.id).collection("completions").doc(userId),
    );
    const completionDocs =
      completionRefs.length > 0 ? await db.getAll(...completionRefs) : [];

    const tasksById = new Map<string, CalendarTask>();

    assignedDocs.forEach((doc, index) => {
      const task = toPublicTask(doc.id, doc.data());
      if (!task) {
        return;
      }

      tasksById.set(doc.id, {
        ...task,
        completed: completionDocs[index]?.exists ?? false,
        completedAt:
          completionDocs[index]?.exists &&
          completionDocs[index]?.data()?.completedAt
            ? (completionDocs[index]!.data()!.completedAt as Timestamp)
                .toDate()
                .toISOString()
            : null,
      });
    });

    if (includeCreated) {
      const createdSnapshot = await db
        .collection("tasks")
        .where("creatorId", "==", userId)
        .get();

      const createdOnlyDocs = createdSnapshot.docs.filter(
        (doc) => !tasksById.has(doc.id),
      );

      const createdOnlyTasks = await Promise.all(
        createdOnlyDocs.map(async (doc) => {
          const task = toPublicTask(doc.id, doc.data());
          if (!task) {
            return null;
          }

          if (
            task.assignedTeams.length === 0 &&
            task.assignedUsers.length === 0
          ) {
            return { ...task, completed: false, completedAt: null };
          }

          const [assignees, completionSnapshot] = await Promise.all([
            getTaskAssignees(db, task.assignedTeams, task.assignedUsers),
            db.collection("tasks").doc(doc.id).collection("completions").get(),
          ]);

          return {
            ...task,
            completed: completionSnapshot.size >= assignees.length,
            completedAt: null,
          };
        }),
      );

      for (const task of createdOnlyTasks) {
        if (task) {
          tasksById.set(task.id, task);
        }
      }
    }

    const tasks = [...tasksById.values()].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("List calendar tasks failed:", error);
    return res.status(500).json({ error: "List tasks failed" });
  }
}
