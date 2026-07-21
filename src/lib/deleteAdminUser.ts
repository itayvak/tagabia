import type {
  DeleteAdminUserErrorResponse,
  DeleteAdminUserSuccessResponse,
} from "@/types/user";

export async function deleteAdminUser(
  adminUserId: string,
  targetUserId: string,
) {
  const response = await fetch(
    `/api/admin/users/${encodeURIComponent(targetUserId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: adminUserId }),
    },
  );
  const data = (await response.json()) as
    | DeleteAdminUserSuccessResponse
    | DeleteAdminUserErrorResponse;

  return { response, data };
}
