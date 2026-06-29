import type { TaskFormField } from "@/types/taskForm";
import { parseMultiSelectValue } from "@/lib/taskFormValidation";

export function formatSubmissionAnswer(
  field: TaskFormField,
  answers: Record<string, string>,
): string {
  const rawValue = answers[field.id] ?? "";

  if (!rawValue) {
    return "—";
  }

  if (field.type === "multiSelect") {
    const selected = parseMultiSelectValue(rawValue);
    return selected.length > 0 ? selected.join(", ") : "—";
  }

  return rawValue;
}
