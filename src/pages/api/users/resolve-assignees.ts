import { hasAssigneeSelection, type AssigneeSelection } from "@/lib/platoons";
import { isAssigneeSelection, resolveAssigneeIds } from "@/lib/resolveAssignees";
import type { NextApiRequest, NextApiResponse } from "next";

interface ResolveAssigneesSuccessResponse {
  assigneeIds: string[];
}

interface ResolveAssigneesErrorResponse {
  error: string;
}

type ResolveAssigneesResponse =
  | ResolveAssigneesSuccessResponse
  | ResolveAssigneesErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResolveAssigneesResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { selection } = req.body as { selection?: unknown };

  if (!isAssigneeSelection(selection)) {
    return res.status(400).json({ error: "Invalid assignee selection" });
  }

  if (!hasAssigneeSelection(selection)) {
    return res.status(200).json({ assigneeIds: [] });
  }

  try {
    const assigneeIds = await resolveAssigneeIds(selection);
    return res.status(200).json({ assigneeIds });
  } catch (error) {
    console.error("Resolve assignees failed:", error);
    return res.status(500).json({ error: "Resolve assignees failed" });
  }
}
