import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type {
  FirestoreUser,
  GetPersonalTodosErrorResponse,
  GetPersonalTodosSuccessResponse,
  PersonalTodoItem,
  SavePersonalTodosErrorResponse,
  SavePersonalTodosRequestBody,
  SavePersonalTodosSuccessResponse,
} from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

const MAX_TODOS = 100;
const MAX_DESCRIPTION_LENGTH = 500;

type GetPersonalTodosResponse =
  | GetPersonalTodosSuccessResponse
  | GetPersonalTodosErrorResponse;

type SavePersonalTodosResponse =
  | SavePersonalTodosSuccessResponse
  | SavePersonalTodosErrorResponse;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

function validatePersonalTodos(value: unknown): PersonalTodoItem[] | { error: string } {
  if (!Array.isArray(value)) {
    return { error: "Todos must be an array" };
  }

  if (value.length > MAX_TODOS) {
    return { error: `Too many todos (max ${MAX_TODOS})` };
  }

  const todos: PersonalTodoItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return { error: "Invalid todo item" };
    }

    const { id, text, description, dueDate, completed, createdAt } =
      item as Partial<PersonalTodoItem>;

    if (!isNonEmptyString(id)) {
      return { error: "Todo id is required" };
    }

    if (!isNonEmptyString(text)) {
      return { error: "Todo text is required" };
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== "string") {
        return { error: "Todo description must be a string" };
      }

      if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
        return { error: `Todo description is too long (max ${MAX_DESCRIPTION_LENGTH})` };
      }
    }

    if (dueDate !== undefined && dueDate !== null) {
      if (typeof dueDate !== "string" || !isValidIsoDate(dueDate)) {
        return { error: "Todo dueDate must be a valid ISO date" };
      }
    }

    if (typeof completed !== "boolean") {
      return { error: "Todo completed must be a boolean" };
    }

    if (!isValidIsoDate(createdAt)) {
      return { error: "Todo createdAt must be a valid ISO date" };
    }

    const normalizedDescription =
      typeof description === "string" && description.trim().length > 0
        ? description.trim()
        : undefined;

    todos.push({
      id: id.trim(),
      text: text.trim(),
      ...(normalizedDescription ? { description: normalizedDescription } : {}),
      ...(typeof dueDate === "string" && dueDate.trim().length > 0 ? { dueDate } : {}),
      completed,
      createdAt,
    });
  }

  return todos;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetPersonalTodosResponse | SavePersonalTodosResponse>,
) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }

  if (req.method === "PUT") {
    return handlePut(req, res);
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<GetPersonalTodosResponse>,
) {
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

    const userData = userDoc.data() as FirestoreUser;
    const todos = Array.isArray(userData.personalTodos) ? userData.personalTodos : [];

    return res.status(200).json({ todos });
  } catch (error) {
    console.error("Get personal todos failed:", error);
    return res.status(500).json({ error: "Get personal todos failed" });
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<SavePersonalTodosResponse>,
) {
  const { userId, todos } = req.body as Partial<SavePersonalTodosRequestBody>;

  if (!isNonEmptyString(userId)) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const validatedTodos = validatePersonalTodos(todos);
  if ("error" in validatedTodos) {
    return res.status(400).json({ error: validatedTodos.error });
  }

  const trimmedUserId = userId.trim();

  try {
    const userRef = getAdminFirestore().collection("users").doc(trimmedUserId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    await userRef.update({ personalTodos: validatedTodos });

    return res.status(200).json({ todos: validatedTodos });
  } catch (error) {
    console.error("Save personal todos failed:", error);
    return res.status(500).json({ error: "Save personal todos failed" });
  }
}
