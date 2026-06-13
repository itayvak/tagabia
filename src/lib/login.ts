import type {
  LoginErrorResponse,
  LoginNeedsPasswordSetupResponse,
  LoginSuccessResponse,
} from "@/types/user";

export function isLoginNeedsPasswordSetup(
  data:
    | LoginSuccessResponse
    | LoginNeedsPasswordSetupResponse
    | LoginErrorResponse,
): data is LoginNeedsPasswordSetupResponse {
  return "needsPasswordSetup" in data && data.needsPasswordSetup === true;
}

export async function loginWithCredentials(id: string, password?: string) {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, password: password ?? "" }),
  });

  const data = (await response.json()) as
    | LoginSuccessResponse
    | LoginNeedsPasswordSetupResponse
    | LoginErrorResponse;

  return { response, data };
}
