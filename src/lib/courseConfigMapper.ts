import type {
  FirestoreCourseConfig,
  PublicCourseConfig,
  PublicCourseWeek,
  StoredCourseWeek,
} from "@/types/courseConfig";
import {
  isValidWeekId,
  resolveWeekById,
  resolveWeekByName,
} from "@/lib/weekCatalog";

export const COURSE_CONFIG_COLLECTION = "courseConfig";
export const COURSE_CONFIG_DOC_ID = "main";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function resolveStoredWeek(entry: unknown): PublicCourseWeek | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const weekId = (entry as { weekId?: unknown }).weekId;
  if (typeof weekId === "string" && weekId.trim()) {
    const week = resolveWeekById(weekId.trim());
    if (week) {
      return { weekId: week.id, name: week.name, image: week.image };
    }
  }

  const name = (entry as { name?: unknown }).name;
  if (typeof name === "string" && name.trim()) {
    const week = resolveWeekByName(name);
    if (week) {
      return { weekId: week.id, name: week.name, image: week.image };
    }
  }

  return null;
}

function parseWeeks(value: unknown): PublicCourseConfig["weeks"] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const weeks = value
    .map((entry) => resolveStoredWeek(entry))
    .filter((week): week is PublicCourseWeek => week !== null);

  return weeks.length > 0 ? weeks : null;
}

export function parseStoredWeeks(value: unknown): StoredCourseWeek[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const weeks = value
    .map((entry) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof (entry as { weekId?: unknown }).weekId !== "string"
      ) {
        return null;
      }

      const weekId = (entry as { weekId: string }).weekId.trim();
      if (!isValidWeekId(weekId)) {
        return null;
      }

      return { weekId };
    })
    .filter((week): week is StoredCourseWeek => week !== null);

  return weeks.length > 0 ? weeks : null;
}

export function toPublicCourseConfig(
  data: FirebaseFirestore.DocumentData,
): PublicCourseConfig | null {
  const config = data as Partial<FirestoreCourseConfig>;

  if (
    typeof config.startDate !== "string" ||
    !DATE_KEY_PATTERN.test(config.startDate)
  ) {
    return null;
  }

  const weeks = parseWeeks(config.weeks);
  if (!weeks) {
    return null;
  }

  return {
    startDate: config.startDate,
    weeks,
  };
}

export function isValidDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}
