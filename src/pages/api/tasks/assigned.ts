import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicTask } from "@/lib/taskMapper";
import type {
  ListTasksErrorResponse,
  ListTasksSuccessResponse,
  PublicTask,
} from "@/types/task";
import type { NextApiRequest, NextApiResponse } from "next";

type ListTasksResponse = ListTasksSuccessResponse | ListTasksErrorResponse;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("tasks")
      .where("assignees", "array-contains", userId)
      .get();

    const completionRefs = snapshot.docs.map((doc) =>
      db.collection("tasks").doc(doc.id).collection("completions").doc(userId),
    );
    const completionDocs =
      completionRefs.length > 0 ? await db.getAll(...completionRefs) : [];

    const tasks = snapshot.docs
      .filter((_, index) => !completionDocs[index]?.exists)
      .map((doc) => toPublicTask(doc.id, doc.data()))
      .filter((task): task is PublicTask => task !== null)
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("List assigned tasks failed:", error);
    return res.status(500).json({ error: "List tasks failed" });
  }
}
