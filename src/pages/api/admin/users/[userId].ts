import { isAdminUser } from "@/lib/admin";
import { canAccessAdminByUserId } from "@/lib/adminAccess";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicUser } from "@/lib/toPublicUser";
import { validateUserFields } from "@/lib/userCsv";
import { userNeedsPasswordSetup } from "@/lib/userPassword";
import type {
  AdminUserListItem,
  DeleteAdminUserErrorResponse,
  DeleteAdminUserSuccessResponse,
  FirestoreUser,
  UpdateAdminUserErrorResponse,
  UpdateAdminUserRequestBody,
  UpdateAdminUserSuccessResponse,
} from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

type UpdateAdminUserResponse =
  | UpdateAdminUserSuccessResponse
  | UpdateAdminUserErrorResponse;

type DeleteAdminUserResponse =
  | DeleteAdminUserSuccessResponse
  | DeleteAdminUserErrorResponse;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toAdminUserListItem(id: string, data: FirestoreUser): AdminUserListItem {
  return {
    ...toPublicUser(id, data),
    needsPasswordSetup: userNeedsPasswordSetup(data),
  };
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<UpdateAdminUserResponse>,
  targetUserId: string,
) {
  const { userId, user } = req.body as Partial<UpdateAdminUserRequestBody>;

  if (!isNonEmptyString(userId)) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!(await canAccessAdminByUserId(userId.trim()))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!user || typeof user !== "object") {
    return res.status(400).json({ error: "User data is required" });
  }

  const validated = validateUserFields({
    fullname: String(user.fullname ?? ""),
    password: typeof user.password === "string" ? user.password : undefined,
    rank: String(user.rank ?? ""),
    role: String(user.role ?? ""),
    platoon: String(user.platoon ?? ""),
    team: user.team ?? "",
  });

  if ("error" in validated) {
    return res.status(400).json({ error: validated.error });
  }

  try {
    const db = getAdminFirestore();
    const docRef = db.collection("users").doc(targetUserId);
    const existingDoc = await docRef.get();

    if (!existingDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing = existingDoc.data() as FirestoreUser;
    const password =
      typeof user.password === "string" && user.password.trim()
        ? validated.data.password
        : existing.password;

    const updated: FirestoreUser = {
      ...existing,
      ...validated.data,
      password,
    };

    await docRef.set(updated);

    return res.status(200).json({
      user: toAdminUserListItem(targetUserId, updated),
    });
  } catch (error) {
    console.error("Update admin user failed:", error);
    return res.status(500).json({ error: "Update user failed" });
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<DeleteAdminUserResponse>,
  targetUserId: string,
) {
  const { userId } = req.body as { userId?: string };

  if (!isNonEmptyString(userId)) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!(await canAccessAdminByUserId(userId.trim()))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (isAdminUser(targetUserId)) {
    return res.status(403).json({ error: "Cannot delete admin user" });
  }

  try {
    const db = getAdminFirestore();
    const docRef = db.collection("users").doc(targetUserId);
    const existingDoc = await docRef.get();

    if (!existingDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    await docRef.delete();

    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error("Delete admin user failed:", error);
    return res.status(500).json({ error: "Delete user failed" });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateAdminUserResponse | DeleteAdminUserResponse>,
) {
  const targetUserId = Array.isArray(req.query.userId)
    ? req.query.userId[0]?.trim()
    : typeof req.query.userId === "string"
      ? req.query.userId.trim()
      : "";

  if (!isNonEmptyString(targetUserId)) {
    return res.status(400).json({ error: "Target user ID is required" });
  }

  if (req.method === "PUT") {
    return handlePut(req, res, targetUserId);
  }

  if (req.method === "DELETE") {
    return handleDelete(req, res, targetUserId);
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
