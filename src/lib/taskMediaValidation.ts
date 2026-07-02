export const MAX_TASK_MEDIA_FILES = 10;
export const MAX_TASK_MEDIA_FILE_SIZE_MB = 20;
export const MAX_TASK_MEDIA_FILE_SIZE_BYTES =
  MAX_TASK_MEDIA_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_CONTENT_TYPE_PREFIXES = ["image/", "video/"] as const;
const ALLOWED_CONTENT_TYPES = new Set(["application/pdf"]);

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  pdf: "application/pdf",
};

export function inferContentTypeFromFilename(filename: string): string | null {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) {
    return null;
  }

  return EXTENSION_CONTENT_TYPES[extension] ?? null;
}

export function getTaskMediaContentType(file: File): string {
  const fromType = (file.type ?? "").trim().toLowerCase();
  if (fromType && fromType !== "application/octet-stream") {
    return fromType;
  }

  return inferContentTypeFromFilename(file.name) ?? fromType ?? "application/octet-stream";
}

export function resolveTaskMediaContentType(
  mimetype: string | null | undefined,
  filename: string,
): string {
  const fromMime = mimetype?.trim().toLowerCase();
  if (fromMime && fromMime !== "application/octet-stream") {
    return fromMime;
  }

  return inferContentTypeFromFilename(filename) ?? fromMime ?? "application/octet-stream";
}

export function isAllowedTaskMediaContentType(contentType: string): boolean {
  const normalized = contentType.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (ALLOWED_CONTENT_TYPES.has(normalized)) {
    return true;
  }

  return ALLOWED_CONTENT_TYPE_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix),
  );
}

export function sanitizeTaskMediaFilename(filename: string): string {
  const baseName = filename.split(/[/\\]/).pop() ?? "file";
  const sanitized = baseName.replace(/[^\w.\-()א-ת\s]/gi, "_").trim();
  return sanitized.length > 0 ? sanitized : "file";
}

export function validateTaskMediaFile(file: File): string | null {
  if (file.size > MAX_TASK_MEDIA_FILE_SIZE_BYTES) {
    return "File is too large";
  }

  const contentType = getTaskMediaContentType(file);
  if (!isAllowedTaskMediaContentType(contentType)) {
    return "File type is not allowed";
  }

  return null;
}

export function formatTaskMediaFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
