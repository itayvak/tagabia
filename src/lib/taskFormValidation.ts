import type { TaskFormField, TaskFormFieldInput, TaskFormFieldType } from "@/types/taskForm";

const VALID_FIELD_TYPES = new Set(["text", "multipleChoice", "multiSelect"]);

const MULTI_SELECT_SEPARATOR = "\x1f";

function isOptionFieldType(
  type: TaskFormFieldType,
): type is "multipleChoice" | "multiSelect" {
  return type === "multipleChoice" || type === "multiSelect";
}

export function parseMultiSelectValue(value: string): string[] {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(MULTI_SELECT_SEPARATOR)
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
}

export function serializeMultiSelectValue(values: string[]): string {
  return values.join(MULTI_SELECT_SEPARATOR);
}

export function normalizeFormFieldOptions(
  options: unknown,
): string[] | null {
  if (!Array.isArray(options)) {
    return null;
  }

  const normalized = options
    .filter((option): option is string => typeof option === "string")
    .map((option) => option.trim())
    .filter((option) => option.length > 0);

  return normalized;
}

export function validateFormFieldInputs(
  formFields: unknown,
): { ok: true; fields: TaskFormFieldInput[] } | { ok: false; error: string } {
  if (formFields === undefined || formFields === null) {
    return { ok: true, fields: [] };
  }

  if (!Array.isArray(formFields)) {
    return { ok: false, error: "Form fields must be a list" };
  }

  const fields: TaskFormFieldInput[] = [];

  for (let index = 0; index < formFields.length; index += 1) {
    const raw = formFields[index];
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "Form field data is invalid" };
    }

    const field = raw as Partial<TaskFormFieldInput>;
    const label = typeof field.label === "string" ? field.label.trim() : "";

    if (!label) {
      return { ok: false, error: "Form field label is required" };
    }

    if (!field.type || !VALID_FIELD_TYPES.has(field.type)) {
      return { ok: false, error: "Form field type is invalid" };
    }

    if (typeof field.required !== "boolean") {
      return { ok: false, error: "Form field required flag is invalid" };
    }

    const id =
      typeof field.id === "string" && field.id.trim().length > 0
        ? field.id.trim()
        : undefined;

    if (isOptionFieldType(field.type)) {
      const options = normalizeFormFieldOptions(field.options);
      if (!options || options.length < 2) {
        return {
          ok: false,
          error: "Choice field must have at least two options",
        };
      }

      fields.push({
        id,
        type: field.type,
        label,
        required: field.required,
        order: index,
        options,
      });
      continue;
    }

    fields.push({
      id,
      type: field.type,
      label,
      required: field.required,
      order: index,
    });
  }

  return { ok: true, fields };
}

export function validateFormAnswers(
  fields: TaskFormField[],
  answers: unknown,
): { ok: true; answers: Record<string, string> } | { ok: false; error: string } {
  if (fields.length === 0) {
    return { ok: true, answers: {} };
  }

  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return { ok: false, error: "Form answers are required" };
  }

  const answerMap = answers as Record<string, unknown>;
  const normalizedAnswers: Record<string, string> = {};

  for (const field of fields) {
    const rawValue = answerMap[field.id];
    const value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (field.type === "multiSelect") {
      const selected = parseMultiSelectValue(value);
      const options = field.options ?? [];

      if (field.required && selected.length === 0) {
        return {
          ok: false,
          error: `Required form field is missing: ${field.label}`,
        };
      }

      if (selected.length === 0) {
        continue;
      }

      if (!selected.every((option) => options.includes(option))) {
        return {
          ok: false,
          error: `Invalid option for form field: ${field.label}`,
        };
      }

      normalizedAnswers[field.id] = serializeMultiSelectValue(selected);
      continue;
    }

    if (field.required && !value) {
      return { ok: false, error: `Required form field is missing: ${field.label}` };
    }

    if (!value) {
      continue;
    }

    if (field.type === "multipleChoice") {
      const options = field.options ?? [];
      if (!options.includes(value)) {
        return {
          ok: false,
          error: `Invalid option for form field: ${field.label}`,
        };
      }
    }

    normalizedAnswers[field.id] = value;
  }

  return { ok: true, answers: normalizedAnswers };
}

export function areRequiredFormAnswersFilled(
  fields: TaskFormField[],
  answers: Record<string, string>,
): boolean {
  return fields
    .filter((field) => field.required)
    .every((field) => {
      const value = answers[field.id] ?? "";

      if (field.type === "multiSelect") {
        return parseMultiSelectValue(value).length > 0;
      }

      return value.trim().length > 0;
    });
}
