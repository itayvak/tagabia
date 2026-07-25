import type {
  RequestPasswordResetErrorResponse,
  RequestPasswordResetSuccessResponse,
} from "@/types/user";

export async function requestPasswordReset(id: string) {
  const response = await fetch("/api/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  const data = (await response.json()) as
    | RequestPasswordResetSuccessResponse
    | RequestPasswordResetErrorResponse;

  return { response, data };
}
