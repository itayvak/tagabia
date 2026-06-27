import type { PublicUser } from "@/types/user";

interface FetchUsersByIdsSuccessResponse {
  users: PublicUser[];
}

interface FetchUsersByIdsErrorResponse {
  error: string;
}

export async function fetchUsersByIds(userIds: string[]) {
  const params = new URLSearchParams({
    ids: userIds.join(","),
  });
  const response = await fetch(`/api/users/by-ids?${params.toString()}`);

  const data = (await response.json()) as
    | FetchUsersByIdsSuccessResponse
    | FetchUsersByIdsErrorResponse;

  return { response, data };
}
