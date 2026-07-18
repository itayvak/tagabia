export const TASK_CATEGORIES = ["ל״ע", "סקרים", "מטלת הגשה", "אחר"] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const DEFAULT_TASK_CATEGORY: TaskCategory = "אחר";

export const TASK_CATEGORY_DESCRIPTIONS: Record<TaskCategory, string> = {
  "ל״ע": "מטלה שמבוצעת בזמן לימוד עצמי, כמו קריאה, הכנה או תרגול עצמי.",
  סקרים: "שאלון או סקר שיש למלא, בדרך כלל עם שדות טופס.",
  "מטלת הגשה": "מטלה שדורשת הגשת חומר, מסמך או מענה מפורט מהצוער.",
  אחר: "מטלות שלא מתאימות לקטגוריות האחרות.",
};

export function isTaskCategory(value: unknown): value is TaskCategory {
  return (
    typeof value === "string" &&
    TASK_CATEGORIES.includes(value as TaskCategory)
  );
}

export function normalizeTaskCategory(value: unknown): TaskCategory {
  return isTaskCategory(value) ? value : DEFAULT_TASK_CATEGORY;
}
