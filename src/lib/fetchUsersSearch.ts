import type { PublicUser } from "@/types/user";

interface SearchUsersSuccessResponse {
  users: PublicUser[];
}

interface SearchUsersErrorResponse {
  error: string;
}

export async function fetchUsersSearch(query: string) {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/users/search?${params.toString()}`);

  const data = (await response.json()) as
    | SearchUsersSuccessResponse
    | SearchUsersErrorResponse;

  return { response, data };
}
