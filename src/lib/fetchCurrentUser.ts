import type { PublicUser } from "@/types/user";

interface GetUserSuccessResponse {
  user: PublicUser;
}

interface GetUserErrorResponse {
  error: string;
}

export async function fetchCurrentUser(userId: string) {
  const response = await fetch(
    `/api/users/${encodeURIComponent(userId)}`,
  );

  const data = (await response.json()) as
    | GetUserSuccessResponse
    | GetUserErrorResponse;

  return { response, data };
}
