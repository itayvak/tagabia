import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicTask } from "@/lib/taskMapper";
import type {
  AssignedTask,
  AssignedTaskFilter,
  ListAssignedTasksSuccessResponse,
  ListTasksErrorResponse,
} from "@/types/task";
import type { FirestoreUser } from "@/types/user";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

type ListTasksResponse =
  | ListAssignedTasksSuccessResponse
  | ListTasksErrorResponse;

function parseStatusQuery(value: unknown): AssignedTaskFilter {
  if (value === "completed") {
    return "completed";
  }

  if (value === "all") {
    return "all";
  }

  return "pending";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListTasksResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId =
    typeof req.query.userId === "string" ? req.query.userId.trim() : "";
  const status = parseStatusQuery(req.query.status);

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
    const snapshot = await db
      .collection("tasks")
      .where("assignedTeams", "array-contains", userTeam)
      .get();

    const completionRefs = snapshot.docs.map((doc) =>
      db.collection("tasks").doc(doc.id).collection("completions").doc(userId),
    );
    const completionDocs =
      completionRefs.length > 0 ? await db.getAll(...completionRefs) : [];

    const tasks = snapshot.docs
      .map((doc, index): AssignedTask | null => {
        const task = toPublicTask(doc.id, doc.data());
        if (!task) {
          return null;
        }

        const completionDoc = completionDocs[index];
        const completed = completionDoc?.exists ?? false;
        const completionData = completionDoc?.data();
        const completedAt =
          completed && completionData?.completedAt
            ? (completionData.completedAt as Timestamp).toDate().toISOString()
            : null;

        return { ...task, completed, completedAt };
      })
      .filter((task): task is AssignedTask => task !== null)
      .filter((task) =>
        status === "all" ? true : status === "completed" ? task.completed : !task.completed,
      )
      .sort((a, b) => {
        if (status === "completed") {
          const aTime = a.completedAt
            ? new Date(a.completedAt).getTime()
            : 0;
          const bTime = b.completedAt
            ? new Date(b.completedAt).getTime()
            : 0;
          return bTime - aTime;
        }

        // For `pending` and `all`, default to sorting by due date ascending.
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("List assigned tasks failed:", error);
    return res.status(500).json({ error: "List tasks failed" });
  }
}
