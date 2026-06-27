import type { PublicUser } from "@/types/user";

interface FetchUsersByTeamsSuccessResponse {
  users: PublicUser[];
}

interface FetchUsersByTeamsErrorResponse {
  error: string;
}

export async function fetchUsersByTeams(teamIds: number[]) {
  const params = new URLSearchParams({
    teams: teamIds.join(","),
  });
  const response = await fetch(
    `/api/users/by-teams?${params.toString()}`,
  );

  const data = (await response.json()) as
    | FetchUsersByTeamsSuccessResponse
    | FetchUsersByTeamsErrorResponse;

  return { response, data };
}
