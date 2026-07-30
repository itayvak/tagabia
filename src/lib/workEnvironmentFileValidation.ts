import { isTrainingFileKey } from "@/types/workEnvironment";
import type { WorkEnvironmentFileKey } from "@/types/workEnvironment";

export const MAX_WORK_ENVIRONMENT_FILE_SIZE_MB = 20;
export const MAX_WORK_ENVIRONMENT_FILE_SIZE_BYTES =
  MAX_WORK_ENVIRONMENT_FILE_SIZE_MB * 1024 * 1024;

const EXCEL_CONTENT_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

const DOCX_CONTENT_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function getAllowedContentTypesForFileKey(
  fileKey: WorkEnvironmentFileKey,
): Set<string> {
  return isTrainingFileKey(fileKey) ? DOCX_CONTENT_TYPES : EXCEL_CONTENT_TYPES;
}

function inferContentTypeFromFilename(filename: string): string | null {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) {
    return null;
  }

  return EXTENSION_CONTENT_TYPES[extension] ?? null;
}

export function resolveWorkEnvironmentFileContentType(
  mimetype: string | null | undefined,
  filename: string,
): string {
  const fromMime = mimetype?.trim().toLowerCase();
  if (fromMime && fromMime !== "application/octet-stream") {
    return fromMime;
  }

  return inferContentTypeFromFilename(filename) ?? fromMime ?? "application/octet-stream";
}

export function isAllowedWorkEnvironmentFileContentType(
  fileKey: WorkEnvironmentFileKey,
  contentType: string,
): boolean {
  const normalized = contentType.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return getAllowedContentTypesForFileKey(fileKey).has(normalized);
}
