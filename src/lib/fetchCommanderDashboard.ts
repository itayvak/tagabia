import type {
  CommanderDashboardErrorResponse,
  CommanderDashboardSuccessResponse,
} from "@/types/commanderDashboard";

export async function fetchCommanderDashboard(
  userId: string,
  range?: { from: string; to: string },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ userId });
  if (range) {
    params.set("from", range.from);
    params.set("to", range.to);
  }

  const response = await fetch(`/api/commander/dashboard?${params.toString()}`, {
    signal,
  });
  const data = (await response.json()) as
    | CommanderDashboardSuccessResponse
    | CommanderDashboardErrorResponse;

  return { response, data };
}
