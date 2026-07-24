import type { PublicCourseConfig, PublicCourseWeek } from "@/types/courseConfig";

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDaysBetween(start: Date, end: Date): number {
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.floor((end.getTime() - start.getTime()) / dayMs);
}

export function getCurrentWeekIndex(
  config: PublicCourseConfig,
  today: Date = new Date(),
): number {
  const startDate = parseDateKey(config.startDate);
  const daysSinceStart = getDaysBetween(
    getStartOfDay(startDate),
    getStartOfDay(today),
  );
  return Math.floor(Math.max(daysSinceStart, 0) / 7);
}

export function getCurrentWeek(
  config: PublicCourseConfig | null,
  today: Date = new Date(),
): PublicCourseWeek | null {
  if (!config || config.weeks.length === 0) {
    return null;
  }

  const startDate = parseDateKey(config.startDate);
  const daysSinceStart = getDaysBetween(getStartOfDay(startDate), getStartOfDay(today));
  if (daysSinceStart < 0) {
    return null;
  }

  const weekIndex = getCurrentWeekIndex(config, today);
  return config.weeks[weekIndex] ?? null;
}

export function getCurrentWeekName(
  config: PublicCourseConfig | null,
  today: Date = new Date(),
): string | null {
  return getCurrentWeek(config, today)?.name ?? null;
}

export function getCurrentWeekImage(
  config: PublicCourseConfig | null,
  today: Date = new Date(),
): string | null {
  return getCurrentWeek(config, today)?.image ?? null;
}
