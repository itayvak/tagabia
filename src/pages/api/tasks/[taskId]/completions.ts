import { getUsersInTeams } from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type {
  FirestoreTaskCompletion,
  ListTaskCompletionsErrorResponse,
  ListTaskCompletionsSuccessResponse,
  TaskAssigneeStatus,
} from "@/types/task";
import type { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

type ListTaskCompletionsResponse =
  | ListTaskCompletionsSuccessResponse
  | ListTaskCompletionsErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListTaskCompletionsResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const taskId =
    typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";
  const creatorId =
    typeof req.query.creatorId === "string" ? req.query.creatorId.trim() : "";

  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  if (!creatorId) {
    return res.status(400).json({ error: "Creator ID is required" });
  }

  try {
    const db = getAdminFirestore();
    const taskRef = db.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskData = taskDoc.data();
    if (taskData?.creatorId !== creatorId) {
      return res.status(403).json({ error: "User is not the task creator" });
    }

    const assignedTeams = Array.isArray(taskData?.assignedTeams)
      ? (taskData.assignedTeams as number[])
      : [];

    const [usersInTeams, completionSnapshot] = await Promise.all([
      getUsersInTeams(db, assignedTeams),
      taskRef.collection("completions").get(),
    ]);

    const completionsByUserId = new Map(
      completionSnapshot.docs
        .map((completionDoc) => {
          const completionData =
            completionDoc.data() as Partial<FirestoreTaskCompletion>;
          const completedAt = completionData.completedAt as Timestamp | undefined;

          if (!completedAt) {
            return null;
          }

          return [
            completionDoc.id,
            completedAt.toDate().toISOString(),
          ] as const;
        })
        .filter(
          (entry): entry is readonly [string, string] => entry !== null,
        ),
    );

    const assignees: TaskAssigneeStatus[] = usersInTeams.map(({ id, data }) => {
      const completedAt = completionsByUserId.get(id) ?? null;

      return {
        userId: id,
        assigneeName: data.fullname,
        assigneeRank: data.rank,
        platoon: data.platoon,
        team: data.team,
        completed: completedAt !== null,
        completedAt,
      };
    });

    return res.status(200).json({ assignees });
  } catch (error) {
    console.error("List task completions failed:", error);
    return res.status(500).json({ error: "List completions failed" });
  }
}
