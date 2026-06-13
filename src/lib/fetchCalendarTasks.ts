import type {
  CalendarTask,
  ListCalendarTasksErrorResponse,
  ListCalendarTasksSuccessResponse,
} from "@/types/task";
import type { PublicUser } from "@/types/user";

export async function fetchCalendarTasks(user: PublicUser) {
  const params = new URLSearchParams({
    userId: user.id,
    includeCreated: String(user.role !== "peasant"),
  });

  const response = await fetch(`/api/tasks/calendar?${params.toString()}`);

  const data = (await response.json()) as
    | ListCalendarTasksSuccessResponse
    | ListCalendarTasksErrorResponse;

  if (!response.ok) {
    const { error } = data as ListCalendarTasksErrorResponse;
    return { response, tasks: [] as CalendarTask[], error };
  }

  return {
    response,
    tasks: (data as ListCalendarTasksSuccessResponse).tasks,
    error: undefined,
  };
}
