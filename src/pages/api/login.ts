import { passwordsMatch } from "@/lib/password";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicUser } from "@/lib/toPublicUser";
import { userNeedsPasswordSetup } from "@/lib/userPassword";
import type {
  FirestoreUser,
  LoginErrorResponse,
  LoginNeedsPasswordSetupResponse,
  LoginRequestBody,
  LoginSuccessResponse,
} from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

type LoginResponse =
  | LoginSuccessResponse
  | LoginNeedsPasswordSetupResponse
  | LoginErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, password } = req.body as Partial<LoginRequestBody>;

  if (!id?.trim()) {
    return res.status(400).json({ error: "ID is required" });
  }

  try {
    const userId = id.trim();
    const userDoc = await getAdminFirestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userData = userDoc.data() as FirestoreUser;

    if (userNeedsPasswordSetup(userData)) {
      return res.status(200).json({
        needsPasswordSetup: true,
        userId,
      });
    }

    if (!password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!passwordsMatch(password, userData.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.status(200).json({
      user: toPublicUser(userId, userData),
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Login failed" });
  }
}
