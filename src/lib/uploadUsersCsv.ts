import type {
  ImportUsersErrorResponse,
  ImportUsersSuccessResponse,
} from "@/types/user";

export async function uploadUsersCsv(userId: string, csv: string) {
  const response = await fetch("/api/admin/users/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, csv }),
  });

  const data = (await response.json()) as
    | ImportUsersSuccessResponse
    | ImportUsersErrorResponse;

  return { response, data };
}
