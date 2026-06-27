import { getUsersInTeams, normalizeTeamIds } from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicUser } from "@/lib/toPublicUser";
import type { PublicUser } from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

interface ListUsersByTeamsSuccessResponse {
  users: PublicUser[];
}

interface ListUsersByTeamsErrorResponse {
  error: string;
}

type ListUsersByTeamsResponse =
  | ListUsersByTeamsSuccessResponse
  | ListUsersByTeamsErrorResponse;

function parseTeamIdsQuery(value: unknown): number[] | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const rawTeamIds = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return normalizeTeamIds(rawTeamIds);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListUsersByTeamsResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const teamIds = parseTeamIdsQuery(req.query.teams);
  if (!teamIds) {
    return res
      .status(400)
      .json({ error: "Teams query parameter is required" });
  }

  try {
    const db = getAdminFirestore();
    const usersInTeams = await getUsersInTeams(db, teamIds);

    const users = usersInTeams.map(({ id, data }) => toPublicUser(id, data));

    return res.status(200).json({ users });
  } catch (error) {
    console.error("List users by teams failed:", error);
    return res.status(500).json({ error: "List users failed" });
  }
}
