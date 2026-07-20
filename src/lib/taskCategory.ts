export const TASK_CATEGORIES = ["ל״ע", "סקרים", "מטלת הגשה", "אחר"] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const DEFAULT_TASK_CATEGORY: TaskCategory = "אחר";

export const TASK_CATEGORY_DESCRIPTIONS: Record<TaskCategory, string> = {
  "ל״ע": "חומר עיוני ללמידה לקראת שיעור, תרגולים לקראת השיעורים והשבועות השונים, חומר מקצועי.",
  סקרים: "שאלון או סקר שיש למלא.",
  "מטלת הגשה": "משימה רשמית אשר יש להגיש בקמפוס, לרוב בשימוש כתבצ.",
  אחר: "מטלות שלא מתאימות לקטגוריות האחרות - סימולטור פיקודי, משימות ללא הגשה בקמפוס ועוד.",
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
