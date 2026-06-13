import { deriveAssigneeSelection } from "@/lib/resolveAssignees";
import type { AssigneeSelection } from "@/lib/platoons";
import type { NextApiRequest, NextApiResponse } from "next";

interface DeriveAssigneeSelectionSuccessResponse {
  selection: AssigneeSelection;
}

interface DeriveAssigneeSelectionErrorResponse {
  error: string;
}

type DeriveAssigneeSelectionResponse =
  | DeriveAssigneeSelectionSuccessResponse
  | DeriveAssigneeSelectionErrorResponse;

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeriveAssigneeSelectionResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { assigneeIds } = req.body as { assigneeIds?: unknown };

  if (!isStringArray(assigneeIds)) {
    return res.status(400).json({ error: "Assignee IDs must be a list of user IDs" });
  }

  try {
    const selection = await deriveAssigneeSelection(
      [...new Set(assigneeIds.map((id) => id.trim()))],
    );
    return res.status(200).json({ selection });
  } catch (error) {
    console.error("Derive assignee selection failed:", error);
    return res.status(500).json({ error: "Derive assignee selection failed" });
  }
}
