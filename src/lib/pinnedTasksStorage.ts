const PINNED_TASKS_KEY_PREFIX = "tagabia_pinned_tasks";

function getStorageKey(userId: string): string {
  return `${PINNED_TASKS_KEY_PREFIX}_${userId}`;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

export function getPinnedTaskIds(userId: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(getStorageKey(userId));
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isStringArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setPinnedTaskIds(userId: string, taskIds: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(getStorageKey(userId), JSON.stringify(taskIds));
}

export function togglePinnedTask(userId: string, taskId: string): string[] {
  const current = getPinnedTaskIds(userId);

  if (current.includes(taskId)) {
    const next = current.filter((id) => id !== taskId);
    setPinnedTaskIds(userId, next);
    return next;
  }

  const next = [...current, taskId];
  setPinnedTaskIds(userId, next);
  return next;
}

export function prunePinnedTaskIds(
  userId: string,
  validTaskIds: Set<string>,
): string[] {
  const current = getPinnedTaskIds(userId);
  const pruned = current.filter((id) => validTaskIds.has(id));

  if (pruned.length !== current.length) {
    setPinnedTaskIds(userId, pruned);
  }

  return pruned;
}
