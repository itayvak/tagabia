import type { TaskMedia } from "@/types/task";
import type { Timestamp } from "firebase-admin/firestore";

export const WORK_ENVIRONMENT_FILE_KEYS = [
  "shuttles",
  "guardRosters",
  "training1",
  "training2",
  "training3",
  "training4",
  "training5",
] as const;

export type WorkEnvironmentFileKey = (typeof WORK_ENVIRONMENT_FILE_KEYS)[number];

export function isWorkEnvironmentFileKey(
  value: string,
): value is WorkEnvironmentFileKey {
  return (WORK_ENVIRONMENT_FILE_KEYS as readonly string[]).includes(value);
}

export function isTrainingFileKey(key: WorkEnvironmentFileKey): boolean {
  return key.startsWith("training");
}

export interface FirestoreWorkEnvironmentFile {
  title?: string;
  media?: TaskMedia;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface PublicWorkEnvironmentFile {
  key: WorkEnvironmentFileKey;
  title: string | null;
  media: TaskMedia | null;
}

export interface ListWorkEnvironmentFilesSuccessResponse {
  files: PublicWorkEnvironmentFile[];
}

export interface ListWorkEnvironmentFilesErrorResponse {
  error: string;
}

export interface UploadWorkEnvironmentFileSuccessResponse {
  file: PublicWorkEnvironmentFile;
}

export interface UploadWorkEnvironmentFileErrorResponse {
  error: string;
}

export interface UpdateWorkEnvironmentFileTitleRequestBody {
  userId: string;
  title: string;
}

export interface UpdateWorkEnvironmentFileTitleSuccessResponse {
  file: PublicWorkEnvironmentFile;
}

export interface UpdateWorkEnvironmentFileTitleErrorResponse {
  error: string;
}
