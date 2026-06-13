export async function downloadUsersCsv(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(
    `/api/admin/users/export?userId=${encodeURIComponent(userId)}`,
  );

  if (!response.ok) {
    try {
      const data = (await response.json()) as { error?: string };
      return { ok: false, error: data.error ?? "Export users failed" };
    } catch {
      return { ok: false, error: "Export users failed" };
    }
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  const filename =
    contentDisposition?.match(/filename="(.+)"/)?.[1] ?? "users.csv";

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  return { ok: true };
}
