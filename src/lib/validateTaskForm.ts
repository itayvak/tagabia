import { hasTaskAssignment } from "@/lib/assigneeTeams";
import { isTaskCategory, type TaskCategory } from "@/lib/taskCategory";
import { validateFormFieldInputs } from "@/lib/taskFormValidation";
import type { TaskFormFieldInput } from "@/types/taskForm";

export interface TaskFormValidationInput {
  title: string;
  category: TaskCategory | null;
  dueDate: string;
  assignedTeams: number[];
  assignedUsers: string[];
  formFields: TaskFormFieldInput[];
}

function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

export function validateTaskFormData(
  data: TaskFormValidationInput,
): { ok: true } | { ok: false; error: string } {
  if (!isNonEmptyString(data.title)) {
    return { ok: false, error: "Title is required" };
  }

  if (!data.category) {
    return { ok: false, error: "Task category is required" };
  }

  if (!isTaskCategory(data.category)) {
    return { ok: false, error: "Invalid task category" };
  }

  if (!isNonEmptyString(data.dueDate)) {
    return { ok: false, error: "Due date is required" };
  }

  const parsedDueDate = new Date(data.dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    return { ok: false, error: "Invalid due date" };
  }

  if (!hasTaskAssignment(data.assignedTeams, data.assignedUsers)) {
    return { ok: false, error: "At least one assignee is required" };
  }

  const formFieldsValidation = validateFormFieldInputs(data.formFields);
  if (!formFieldsValidation.ok) {
    return { ok: false, error: formFieldsValidation.error };
  }

  return { ok: true };
}
