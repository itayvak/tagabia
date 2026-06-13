import { isAdminUser } from "@/lib/admin";
import { rowsToCsv } from "@/lib/csv";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { USER_CSV_HEADERS } from "@/lib/userCsv";
import type { FirestoreUser } from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function compareUsers(
  [idA, userA]: readonly [string, FirestoreUser],
  [idB, userB]: readonly [string, FirestoreUser],
): number {
  const platoonCompare = userA.platoon.localeCompare(userB.platoon);
  if (platoonCompare !== 0) {
    return platoonCompare;
  }

  const teamCompare = userA.team - userB.team;
  if (teamCompare !== 0) {
    return teamCompare;
  }

  const nameCompare = userA.fullname.localeCompare(userB.fullname, "he");
  if (nameCompare !== 0) {
    return nameCompare;
  }

  return idA.localeCompare(idB);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId =
    typeof req.query.userId === "string" ? req.query.userId.trim() : "";

  if (!isNonEmptyString(userId)) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!isAdminUser(userId)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const snapshot = await getAdminFirestore().collection("users").get();

    const rows = snapshot.docs
      .map((doc) => [doc.id, doc.data() as FirestoreUser] as const)
      .sort(compareUsers)
      .map(([id, user]) => [
        id,
        user.fullname,
        user.password,
        user.rank,
        user.role,
        user.platoon,
        String(user.team),
      ]);

    const csv = `\uFEFF${rowsToCsv(USER_CSV_HEADERS, rows)}`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export users failed:", error);
    return res.status(500).json({ error: "Export users failed" });
  }
}
