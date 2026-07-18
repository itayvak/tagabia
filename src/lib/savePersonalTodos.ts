import type {
  PersonalTodoItem,
  SavePersonalTodosErrorResponse,
  SavePersonalTodosSuccessResponse,
} from "@/types/user";

export async function savePersonalTodos(userId: string, todos: PersonalTodoItem[]) {
  const response = await fetch("/api/users/personal-todos", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, todos }),
  });

  const data = (await response.json()) as
    | SavePersonalTodosSuccessResponse
    | SavePersonalTodosErrorResponse;

  return { response, data };
}
