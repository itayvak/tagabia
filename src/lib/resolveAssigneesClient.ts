import type { AssigneeSelection } from "@/lib/platoons";

interface ResolveAssigneesSuccessResponse {
  assigneeIds: string[];
}

interface ResolveAssigneesErrorResponse {
  error: string;
}

export async function resolveAssignees(selection: AssigneeSelection) {
  const response = await fetch("/api/users/resolve-assignees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selection }),
  });

  const data = (await response.json()) as
    | ResolveAssigneesSuccessResponse
    | ResolveAssigneesErrorResponse;

  return { response, data };
}

interface DeriveAssigneeSelectionSuccessResponse {
  selection: AssigneeSelection;
}

interface DeriveAssigneeSelectionErrorResponse {
  error: string;
}

export async function deriveAssigneeSelection(assigneeIds: string[]) {
  const response = await fetch("/api/users/derive-assignee-selection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assigneeIds }),
  });

  const data = (await response.json()) as
    | DeriveAssigneeSelectionSuccessResponse
    | DeriveAssigneeSelectionErrorResponse;

  return { response, data };
}
