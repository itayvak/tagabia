import type {
  GetPersonalTodosErrorResponse,
  GetPersonalTodosSuccessResponse,
} from "@/types/user";

export async function fetchPersonalTodos(userId: string) {
  const response = await fetch(
    `/api/users/personal-todos?userId=${encodeURIComponent(userId)}`,
  );

  const data = (await response.json()) as
    | GetPersonalTodosSuccessResponse
    | GetPersonalTodosErrorResponse;

  return { response, data };
}
