import type {
  SetPasswordErrorResponse,
  SetPasswordSuccessResponse,
} from "@/types/user";

export async function setPassword(id: string, password: string) {
  const response = await fetch("/api/set-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, password }),
  });

  const data = (await response.json()) as
    | SetPasswordSuccessResponse
    | SetPasswordErrorResponse;

  return { response, data };
}
