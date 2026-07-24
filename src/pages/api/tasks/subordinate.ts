import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { isBattalionRole, getSubordinateRole } from "@/lib/roles";
import { toPublicTask } from "@/lib/taskMapper";
import type {
  ListTasksErrorResponse,
  ListTasksSuccessResponse,
  PublicTask,
} from "@/types/task";
import type { FirestoreUser, Platoon } from "@/types/user";
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

  const viewerId =
    typeof req.query.viewerId === "string" ? req.query.viewerId.trim() : "";

  if (!viewerId) {
    return res.status(400).json({ error: "Viewer ID is required" });
  }

  try {
    const db = getAdminFirestore();
    const viewerDoc = await db.collection("users").doc(viewerId).get();

    if (!viewerDoc.exists) {
      return res.status(400).json({ error: "User not found" });
    }

    const viewerData = viewerDoc.data() as FirestoreUser;
    const viewerRole = viewerData.role;
    const viewerPlatoon = viewerData.platoon;

    const subordinateRole = getSubordinateRole(viewerRole);
    if (!subordinateRole) {
      return res.status(200).json({ tasks: [] });
    }

    // Query users with the subordinate role
    const usersSnapshot = await db
      .collection("users")
      .where("role", "==", subordinateRole)
      .get();

    let subordinateUserIds = usersSnapshot.docs.map((doc) => doc.id);

    // Platoon roles are scoped to their own platoon; battalion roles see all
    if (!isBattalionRole(viewerRole)) {
      const platoonDocs = usersSnapshot.docs.filter((doc) => {
        const userData = doc.data() as FirestoreUser;
        return userData.platoon === viewerPlatoon;
      });
      subordinateUserIds = platoonDocs.map((doc) => doc.id);
    }

    if (subordinateUserIds.length === 0) {
      return res.status(200).json({ tasks: [] });
    }

    // Firestore "in" query supports up to 10 values — batch if needed
    const BATCH_SIZE = 10;
    const allTasks: PublicTask[] = [];

    for (let i = 0; i < subordinateUserIds.length; i += BATCH_SIZE) {
      const batch = subordinateUserIds.slice(i, i + BATCH_SIZE);
      const snapshot = await db
        .collection("tasks")
        .where("creatorId", "in", batch)
        .get();

      for (const doc of snapshot.docs) {
        const task = toPublicTask(doc.id, doc.data());
        if (task) {
          allTasks.push(task);
        }
      }
    }

    allTasks.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
    );

    return res.status(200).json({ tasks: allTasks });
  } catch (error) {
    console.error("List subordinate tasks failed:", error);
    return res.status(500).json({ error: "List tasks failed" });
  }
}
