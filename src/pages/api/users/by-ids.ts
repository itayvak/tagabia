import { getUsersByIds, normalizeUserIds } from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicUser } from "@/lib/toPublicUser";
import type { PublicUser } from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

interface ListUsersByIdsSuccessResponse {
  users: PublicUser[];
}

interface ListUsersByIdsErrorResponse {
  error: string;
}

type ListUsersByIdsResponse =
  | ListUsersByIdsSuccessResponse
  | ListUsersByIdsErrorResponse;

function parseUserIdsQuery(value: unknown): string[] | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const rawUserIds = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return normalizeUserIds(rawUserIds);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListUsersByIdsResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userIds = parseUserIdsQuery(req.query.ids);
  if (!userIds || userIds.length === 0) {
    return res.status(400).json({ error: "User IDs query parameter is required" });
  }

  try {
    const db = getAdminFirestore();
    const usersByIds = await getUsersByIds(db, userIds);

    const users = usersByIds.map(({ id, data }) => toPublicUser(id, data));

    return res.status(200).json({ users });
  } catch (error) {
    console.error("List users by IDs failed:", error);
    return res.status(500).json({ error: "List users failed" });
  }
}
