import { rowsToCsv } from "@/lib/csv";
import { formatDueDate } from "@/lib/taskDate";
import { parseMultiSelectValue } from "@/lib/taskFormValidation";
import type { TaskFormField, TaskSubmissionEntry } from "@/types/taskForm";

const SUBMISSION_CSV_HEADERS = ["דרגה", "שם", "תאריך הגשה"] as const;

function formatAnswerForCsv(
  field: TaskFormField,
  answers: Record<string, string>,
): string {
  const rawValue = answers[field.id] ?? "";

  if (!rawValue) {
    return "";
  }

  if (field.type === "multiSelect") {
    return parseMultiSelectValue(rawValue).join(", ");
  }

  return rawValue;
}

function sanitizeFilename(title: string): string {
  const sanitized = title
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .trim();

  return sanitized.length > 0 ? sanitized : "task-submissions";
}

export function buildTaskSubmissionsCsv(
  formFields: TaskFormField[],
  submissions: TaskSubmissionEntry[],
): string {
  const sortedFields = [...formFields].sort((a, b) => a.order - b.order);
  const headers = [
    ...SUBMISSION_CSV_HEADERS,
    ...sortedFields.map((field) => field.label),
  ];

  const rows = submissions.map((submission) => [
    submission.completerRank,
    submission.completerName,
    formatDueDate(submission.submittedAt),
    ...sortedFields.map((field) =>
      formatAnswerForCsv(field, submission.answers),
    ),
  ]);

  return `\uFEFF${rowsToCsv(headers, rows)}`;
}

export function downloadTaskSubmissionsCsv(
  taskTitle: string,
  formFields: TaskFormField[],
  submissions: TaskSubmissionEntry[],
): void {
  const csv = buildTaskSubmissionsCsv(formFields, submissions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(taskTitle)}-submissions.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
