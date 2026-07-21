import { canAccessAdminByUserId } from "@/lib/adminAccess";
import { rowsToCsv } from "@/lib/csv";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { sortUserEntries } from "@/lib/sortUsers";
import { USER_CSV_HEADERS } from "@/lib/userCsv";
import type { FirestoreUser } from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

  if (!(await canAccessAdminByUserId(userId))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const snapshot = await getAdminFirestore().collection("users").get();

    const rows = sortUserEntries(
      snapshot.docs.map((doc) => [doc.id, doc.data() as FirestoreUser] as const),
    ).map(([id, user]) => [
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
