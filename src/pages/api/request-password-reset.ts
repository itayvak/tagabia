import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type {
  RequestPasswordResetErrorResponse,
  RequestPasswordResetRequestBody,
  RequestPasswordResetSuccessResponse,
} from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

type RequestPasswordResetResponse =
  | RequestPasswordResetSuccessResponse
  | RequestPasswordResetErrorResponse;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RequestPasswordResetResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.body as Partial<RequestPasswordResetRequestBody>;

  if (!isNonEmptyString(id)) {
    return res.status(400).json({ error: "ID is required" });
  }

  try {
    const userId = id.trim();
    const userRef = getAdminFirestore().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    await userRef.update({ requestedPasswordReset: true });

    return res.status(200).json({ requested: true });
  } catch (error) {
    console.error("Request password reset failed:", error);
    return res.status(500).json({ error: "Request password reset failed" });
  }
}
