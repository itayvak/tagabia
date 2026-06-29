import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicTask } from "@/lib/taskMapper";
import type {
  ListTasksErrorResponse,
  ListTasksSuccessResponse,
  PublicTask,
} from "@/types/task";
import type { NextApiRequest, NextApiResponse } from "next";

type ListTasksResponse = ListTasksSuccessResponse | ListTasksErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListTasksResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const creatorId =
    typeof req.query.creatorId === "string" ? req.query.creatorId.trim() : "";

  if (!creatorId) {
    return res.status(400).json({ error: "Creator ID is required" });
  }

  try {
    const snapshot = await getAdminFirestore()
      .collection("tasks")
      .where("creatorId", "==", creatorId)
      .get();

    const tasks = snapshot.docs
      .map((doc) => toPublicTask(doc.id, doc.data()))
      .filter((task): task is PublicTask => task !== null)
      .sort(
        (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
      );

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("List created tasks failed:", error);
    return res.status(500).json({ error: "List tasks failed" });
  }
}
