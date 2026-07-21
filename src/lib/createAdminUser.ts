import type {
  CreateAdminUserErrorResponse,
  CreateAdminUserInput,
  CreateAdminUserSuccessResponse,
} from "@/types/user";

export async function createAdminUser(
  userId: string,
  user: CreateAdminUserInput,
) {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, user }),
  });
  const data = (await response.json()) as
    | CreateAdminUserSuccessResponse
    | CreateAdminUserErrorResponse;

  return { response, data };
}
