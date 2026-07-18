import { searchUsers } from "@/lib/assigneeTeams";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicUser } from "@/lib/toPublicUser";
import type { PublicUser } from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

interface SearchUsersSuccessResponse {
  users: PublicUser[];
}

interface SearchUsersErrorResponse {
  error: string;
}

type SearchUsersResponse = SearchUsersSuccessResponse | SearchUsersErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchUsersResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const db = getAdminFirestore();
    const usersInSearch = await searchUsers(db, query);

    const users = usersInSearch.map(({ id, data }) => toPublicUser(id, data));

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Search users failed:", error);
    return res.status(500).json({ error: "Search users failed" });
  }
}
