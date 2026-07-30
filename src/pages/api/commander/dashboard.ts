import {
  COURSE_CONFIG_COLLECTION,
  COURSE_CONFIG_DOC_ID,
  toPublicCourseConfig,
} from "@/lib/courseConfigMapper";
import {
  buildCommanderDashboard,
  createCommanderRange,
  getDefaultCommanderRange,
  isCommanderDateKey,
} from "@/lib/commanderDashboard";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicTask } from "@/lib/taskMapper";
import { toPublicUser } from "@/lib/toPublicUser";
import type {
  CommanderDashboardErrorResponse,
  CommanderDashboardSuccessResponse,
} from "@/types/commanderDashboard";
import type { FirestoreUser, PublicUser } from "@/types/user";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

type CommanderDashboardResponse =
  | CommanderDashboardSuccessResponse
  | CommanderDashboardErrorResponse;

const FIRESTORE_ARRAY_LIMIT = 30;
const FIRESTORE_GET_ALL_CHUNK_SIZE = 200;

function parseQueryValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CommanderDashboardResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = parseQueryValue(req.query.userId);
  const from = parseQueryValue(req.query.from);
  const to = parseQueryValue(req.query.to);

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if ((from && !to) || (!from && to)) {
    return res.status(400).json({ error: "Both date boundaries are required" });
  }

  if (
    (from && !isCommanderDateKey(from)) ||
    (to && !isCommanderDateKey(to)) ||
    (from && to && from > to)
  ) {
    return res.status(400).json({ error: "Invalid date range" });
  }

  try {
    const db = getAdminFirestore();
    const commanderDoc = await db.collection("users").doc(userId).get();

    if (!commanderDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const commanderData = commanderDoc.data() as FirestoreUser;
    if (commanderData.role !== "commander") {
      return res.status(403).json({ error: "Commander access required" });
    }

    const [membersSnapshot, byTeamSnapshot, courseConfigDoc] =
      await Promise.all([
        db
          .collection("users")
          .where("team", "==", commanderData.team)
          .get(),
        db
          .collection("tasks")
          .where("assignedTeams", "array-contains", commanderData.team)
          .get(),
        db
          .collection(COURSE_CONFIG_COLLECTION)
          .doc(COURSE_CONFIG_DOC_ID)
          .get(),
      ]);

    const members = membersSnapshot.docs
      .map((doc): PublicUser => {
        const data = doc.data() as FirestoreUser;
        return toPublicUser(doc.id, data);
      })
      .filter(
        (member) =>
          member.role !== "commander" && member.role !== "developer",
      )
      .sort((a, b) => a.fullname.localeCompare(b.fullname, "he"));

    const taskDocsById = new Map(
      byTeamSnapshot.docs.map((doc) => [doc.id, doc]),
    );

    for (
      let index = 0;
      index < members.length;
      index += FIRESTORE_ARRAY_LIMIT
    ) {
      const memberIds = members
        .slice(index, index + FIRESTORE_ARRAY_LIMIT)
        .map((member) => member.id);
      if (memberIds.length === 0) {
        continue;
      }

      const snapshot = await db
        .collection("tasks")
        .where("assignedUsers", "array-contains-any", memberIds)
        .get();
      snapshot.docs.forEach((doc) => taskDocsById.set(doc.id, doc));
    }

    const tasks = [...taskDocsById.values()]
      .map((doc) => toPublicTask(doc.id, doc.data()))
      .filter((task): task is NonNullable<typeof task> => task !== null);

    const completionTargets = tasks.flatMap((task) =>
      members
        .filter(
          (member) =>
            task.assignedTeams.includes(member.team) ||
            task.assignedUsers.includes(member.id),
        )
        .map((member) => ({
          taskId: task.id,
          userId: member.id,
          ref: db
            .collection("tasks")
            .doc(task.id)
            .collection("completions")
            .doc(member.id),
        })),
    );

    const completions: Record<string, Record<string, string>> = {};
    for (
      let index = 0;
      index < completionTargets.length;
      index += FIRESTORE_GET_ALL_CHUNK_SIZE
    ) {
      const chunk = completionTargets.slice(
        index,
        index + FIRESTORE_GET_ALL_CHUNK_SIZE,
      );
      const docs = await db.getAll(...chunk.map((target) => target.ref));

      docs.forEach((doc, docIndex) => {
        if (!doc.exists) {
          return;
        }

        const completedAt = doc.data()?.completedAt;
        if (!(completedAt instanceof Timestamp)) {
          return;
        }

        const target = chunk[docIndex];
        completions[target.taskId] ??= {};
        completions[target.taskId][target.userId] = completedAt
          .toDate()
          .toISOString();
      });
    }

    const now = new Date();
    const courseConfig = courseConfigDoc.exists
      ? toPublicCourseConfig(courseConfigDoc.data()!)
      : null;
    const range =
      from && to
        ? createCommanderRange(from, to)
        : getDefaultCommanderRange(courseConfig, now);
    const commander = toPublicUser(userId, commanderData);
    const dashboard = buildCommanderDashboard({
      commander,
      members,
      tasks,
      completions,
      range,
      now: now.toISOString(),
    });

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ dashboard });
  } catch (error) {
    console.error("Load commander dashboard failed:", error);
    return res.status(500).json({ error: "Load commander dashboard failed" });
  }
}
