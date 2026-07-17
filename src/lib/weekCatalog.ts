export interface WeekDefinition {
  id: string;
  name: string;
  image: string;
}

export const WEEK_CATALOG: readonly WeekDefinition[] = [
  {
    id: "threshold",
    name: "שבוע סף",
    image: "/weekBanners/weekThreshhold.png",
  },
  {
    id: "fundamentals",
    name: 'שבוע יסודות צה"ל',
    image: "/weekBanners/weekFundamentals.jpeg",
  },
];

export function getWeekDefinition(weekId: string): WeekDefinition | undefined {
  return WEEK_CATALOG.find((week) => week.id === weekId);
}

export function isValidWeekId(weekId: string): boolean {
  return WEEK_CATALOG.some((week) => week.id === weekId);
}

export function resolveWeekById(weekId: string): WeekDefinition | null {
  return getWeekDefinition(weekId) ?? null;
}

export function resolveWeekByName(name: string): WeekDefinition | null {
  const trimmedName = name.trim();
  return (
    WEEK_CATALOG.find((week) => week.name === trimmedName) ??
    null
  );
}
