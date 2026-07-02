interface DeleteTaskMediaSuccessResponse {
  mediaId: string;
}

interface DeleteTaskMediaErrorResponse {
  error: string;
}

export async function deleteTaskMedia(
  taskId: string,
  mediaId: string,
  userId: string,
) {
  const response = await fetch(`/api/tasks/${taskId}/media/${mediaId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const data = (await response.json()) as
    | DeleteTaskMediaSuccessResponse
    | DeleteTaskMediaErrorResponse;

  return { response, data };
}
