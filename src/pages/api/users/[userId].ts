import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicUser } from "@/lib/toPublicUser";
import type { FirestoreUser, PublicUser } from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

interface GetUserSuccessResponse {
  user: PublicUser;
}

interface GetUserErrorResponse {
  error: string;
}

type GetUserResponse = GetUserSuccessResponse | GetUserErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetUserResponse>,
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
    const userDoc = await getAdminFirestore().collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      user: toPublicUser(userId, userDoc.data() as FirestoreUser),
    });
  } catch (error) {
    console.error("Get user failed:", error);
    return res.status(500).json({ error: "Get user failed" });
  }
}
