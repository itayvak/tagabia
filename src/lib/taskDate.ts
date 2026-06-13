export function getCalendarDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getDueDateCalendarKey(dueDate: string): string {
  return getCalendarDateKey(new Date(dueDate));
}

export function formatDueDate(dueDate: string): string {
  return new Date(dueDate).toLocaleString("he-IL", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getDaysLeft(dueDate: string): number {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const due = new Date(dueDate);
  const startOfDue = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
  );

  return Math.round(
    (startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function formatDaysLeft(dueDate: string): string {
  const daysLeft = getDaysLeft(dueDate);

  if (daysLeft === 0) {
    return "היום";
  }

  if (daysLeft === 1) {
    return "יום אחד נותר";
  }

  if (daysLeft > 1) {
    return `${daysLeft} ימים נותרו`;
  }

  if (daysLeft === -1) {
    return "יום אחד באיחור";
  }

  return `${Math.abs(daysLeft)} ימים באיחור`;
}
