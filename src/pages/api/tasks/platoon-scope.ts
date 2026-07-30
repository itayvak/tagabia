import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getTeamsForPlatoon } from "@/lib/platoons";
import { toPublicTask } from "@/lib/taskMapper";
import type {
  ListTasksErrorResponse,
  ListTasksSuccessResponse,
  PublicTask,
} from "@/types/task";
import type { FirestoreUser } from "@/types/user";
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

  const userId =
    typeof req.query.userId === "string" ? req.query.userId.trim() : "";

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(400).json({ error: "User not found" });
    }

    const userData = userDoc.data() as FirestoreUser;
    const platoonTeams = getTeamsForPlatoon(userData.platoon);

    const snapshot = await db
      .collection("tasks")
      .where("assignedTeams", "array-contains-any", platoonTeams)
      .get();

    const tasks = snapshot.docs
      .map((doc) => toPublicTask(doc.id, doc.data()))
      .filter((task): task is PublicTask => task !== null)
      .sort(
        (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
      );

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("List platoon-scope tasks failed:", error);
    return res.status(500).json({ error: "List tasks failed" });
  }
}
