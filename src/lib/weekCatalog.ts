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
    name: "שבוע יסודות צה״ל",
    image: "/weekBanners/weekFundamentals.jpeg",
  },
  {
    id: "leadershipIntro",
    name: "שבוע מבוא למנהיגות",
    image: "/weekBanners/weekLeadershipIntro.jpeg",
  },
  {
    id: "armyProffeshion",
    name: "שבוע מקצוע צבאי",
    image: "/weekBanners/weekArmyProffeshion.jpeg",
  },
  {
    id: "field",
    name: "שבוע שטח",
    image: "/weekBanners/weekField.jpeg",
  },
  {
    id: "sadach",
    name: "שבוע סד״ח",
    image: "/weekBanners/weekSadach.jpeg",
  },
  {
    id: "commandAndCare",
    name: "שבוע פיקוד וטיפול בפרט",
    image: "/weekBanners/weekCommandAndCare.jpeg",
  },
  {
    id: "haganash",
    name: 'שבוע הגנ"ש',
    image: "/weekBanners/weekHaganash.jpeg",
  },
  {
    id: "identity",
    name: "שבוע מסכם",
    image: "/weekBanners/weekSummary.jpeg",
  },
  {
    id: "summary",
    name: "שבוע זהות",
    image: "/weekBanners/weekIdentity.jpeg",
  },
  {
    id: "completion",
    name: "שבוע סיום",
    image: "/weekBanners/weekCompletion.jpeg",
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
