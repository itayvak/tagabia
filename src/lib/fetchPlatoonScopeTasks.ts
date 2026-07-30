import type {
  ListTasksErrorResponse,
  ListTasksSuccessResponse,
} from "@/types/task";

export async function fetchPlatoonScopeTasks(userId: string) {
  const response = await fetch(
    `/api/tasks/platoon-scope?userId=${encodeURIComponent(userId)}`,
  );

  const data = (await response.json()) as
    | ListTasksSuccessResponse
    | ListTasksErrorResponse;

  return { response, data };
}
