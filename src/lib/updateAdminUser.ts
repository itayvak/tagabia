import type {
  UpdateAdminUserErrorResponse,
  UpdateAdminUserInput,
  UpdateAdminUserSuccessResponse,
} from "@/types/user";

export async function updateAdminUser(
  adminUserId: string,
  targetUserId: string,
  user: UpdateAdminUserInput,
) {
  const response = await fetch(
    `/api/admin/users/${encodeURIComponent(targetUserId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: adminUserId, user }),
    },
  );
  const data = (await response.json()) as
    | UpdateAdminUserSuccessResponse
    | UpdateAdminUserErrorResponse;

  return { response, data };
}
