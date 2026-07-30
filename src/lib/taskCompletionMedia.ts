import { validateTaskMediaFile } from "@/lib/taskMediaValidation";

export const MAX_TASK_COMPLETION_MEDIA_FILES = 5;
export const TASK_COMPLETION_MEDIA_FILE_OPTIONS = [1, 2, 3, 4, 5] as const;

export function validateTaskCompletionMediaFile(file: File): string | null {
  return validateTaskMediaFile(file);
}
