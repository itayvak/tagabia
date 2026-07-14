export function getCalendarDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getDueDateCalendarKey(dueDate: string): string {
  return getCalendarDateKey(new Date(dueDate));
}

export function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} בשעה ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

export type DaysLeftChipUrgency = "past" | "soon" | "thisWeek" | "default";

export function getDaysLeftChipUrgency(dueDate: string): DaysLeftChipUrgency {
  const daysLeft = getDaysLeft(dueDate);

  if (daysLeft < 0) {
    return "past";
  }

  if (daysLeft <= 3) {
    return "soon";
  }

  const dayOfWeek = new Date().getDay();
  const daysUntilEndOfWeek = 6 - dayOfWeek;

  if (daysLeft <= daysUntilEndOfWeek) {
    return "thisWeek";
  }

  return "default";
}

export function isDueThisWeek(
  dueDate: string,
  referenceDate: Date = new Date(),
): boolean {
  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const due = new Date(dueDate);
  const startOfDue = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
  );

  return startOfDue >= startOfWeek && startOfDue <= endOfWeek;
}

export function sortTasksByDueDateWithPastLast<T extends { dueDate: string }>(
  tasks: T[],
): T[] {
  return [...tasks].sort((a, b) => {
    const aIsPast = getDaysLeft(a.dueDate) < 0;
    const bIsPast = getDaysLeft(b.dueDate) < 0;

    if (aIsPast !== bIsPast) {
      return aIsPast ? 1 : -1;
    }

    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}
