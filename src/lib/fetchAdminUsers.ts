import type {
  ListAdminUsersErrorResponse,
  ListAdminUsersSuccessResponse,
} from "@/types/user";

export async function fetchAdminUsers(userId: string) {
  const params = new URLSearchParams({ userId });
  const response = await fetch(`/api/admin/users?${params.toString()}`);
  const data = (await response.json()) as
    | ListAdminUsersSuccessResponse
    | ListAdminUsersErrorResponse;

  return { response, data };
}
