import { canAccessAdminByUserId } from "@/lib/adminAccess";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { sortUserEntries } from "@/lib/sortUsers";
import { toPublicUser } from "@/lib/toPublicUser";
import { validateUserFields } from "@/lib/userCsv";
import { userNeedsPasswordSetup } from "@/lib/userPassword";
import type {
  AdminUserListItem,
  CreateAdminUserErrorResponse,
  CreateAdminUserRequestBody,
  CreateAdminUserSuccessResponse,
  FirestoreUser,
  ListAdminUsersErrorResponse,
  ListAdminUsersSuccessResponse,
} from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

type ListAdminUsersResponse =
  | ListAdminUsersSuccessResponse
  | ListAdminUsersErrorResponse;

type CreateAdminUserResponse =
  | CreateAdminUserSuccessResponse
  | CreateAdminUserErrorResponse;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toAdminUserListItem(id: string, data: FirestoreUser): AdminUserListItem {
  return {
    ...toPublicUser(id, data),
    needsPasswordSetup: userNeedsPasswordSetup(data),
    requestedPasswordReset: data.requestedPasswordReset === true,
  };
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ListAdminUsersResponse>,
) {
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
    const users = sortUserEntries(
      snapshot.docs.map((doc) => [doc.id, doc.data() as FirestoreUser] as const),
    ).map(([id, data]) => toAdminUserListItem(id, data));

    return res.status(200).json({ users });
  } catch (error) {
    console.error("List admin users failed:", error);
    return res.status(500).json({ error: "List users failed" });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<CreateAdminUserResponse>,
) {
  const { userId, user } = req.body as Partial<CreateAdminUserRequestBody>;

  if (!isNonEmptyString(userId)) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!(await canAccessAdminByUserId(userId.trim()))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!user || typeof user !== "object") {
    return res.status(400).json({ error: "User data is required" });
  }

  const targetId = typeof user.id === "string" ? user.id.trim() : "";
  if (!targetId) {
    return res.status(400).json({ error: "User id is required" });
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
    const docRef = db.collection("users").doc(targetId);
    const existing = await docRef.get();

    if (existing.exists) {
      return res.status(409).json({ error: "User already exists" });
    }

    await docRef.set(validated.data);

    return res.status(201).json({
      user: toAdminUserListItem(targetId, validated.data),
    });
  } catch (error) {
    console.error("Create admin user failed:", error);
    return res.status(500).json({ error: "Create user failed" });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListAdminUsersResponse | CreateAdminUserResponse>,
) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }

  if (req.method === "POST") {
    return handlePost(req, res);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
