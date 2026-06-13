import { hashPassword } from "@/lib/password";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicUser } from "@/lib/toPublicUser";
import { userNeedsPasswordSetup } from "@/lib/userPassword";
import type {
  FirestoreUser,
  SetPasswordErrorResponse,
  SetPasswordRequestBody,
  SetPasswordSuccessResponse,
} from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

type SetPasswordResponse = SetPasswordSuccessResponse | SetPasswordErrorResponse;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SetPasswordResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, password } = req.body as Partial<SetPasswordRequestBody>;

  if (!isNonEmptyString(id)) {
    return res.status(400).json({ error: "ID is required" });
  }

  if (!isNonEmptyString(password)) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const userId = id.trim();
    const userRef = getAdminFirestore().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data() as FirestoreUser;

    if (!userNeedsPasswordSetup(userData)) {
      return res.status(409).json({ error: "Password already set" });
    }

    const updatedUser: FirestoreUser = {
      ...userData,
      password: hashPassword(password),
    };

    await userRef.set(updatedUser);

    return res.status(200).json({
      user: toPublicUser(userId, updatedUser),
    });
  } catch (error) {
    console.error("Set password failed:", error);
    return res.status(500).json({ error: "Set password failed" });
  }
}
