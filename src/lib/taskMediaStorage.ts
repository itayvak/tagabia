import { randomUUID } from "crypto";
import { getAdminStorage } from "@/lib/firebaseAdmin";
import { sanitizeTaskMediaFilename } from "@/lib/taskMediaValidation";
import type { TaskMedia } from "@/types/task";

function getTaskMediaStoragePath(
  taskId: string,
  mediaId: string,
  filename: string,
): string {
  return `tasks/${taskId}/media/${mediaId}/${filename}`;
}

function getTaskCompletionMediaStoragePath(
  taskId: string,
  userId: string,
  mediaId: string,
  filename: string,
): string {
  return `tasks/${taskId}/completion-media/${userId}/${mediaId}/${filename}`;
}

function buildFirebaseDownloadUrl(
  bucketName: string,
  storagePath: string,
  downloadToken: string,
): string {
  const encodedPath = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;
}

export async function uploadTaskMedia(
  taskId: string,
  file: {
    buffer: Buffer;
    originalFilename: string;
    contentType: string;
    size: number;
  },
): Promise<TaskMedia> {
  const mediaId = randomUUID();
  const filename = sanitizeTaskMediaFilename(file.originalFilename);
  const storagePath = getTaskMediaStoragePath(taskId, mediaId, filename);
  const downloadToken = randomUUID();
  const bucket = getAdminStorage().bucket();
  const storageFile = bucket.file(storagePath);

  await storageFile.save(file.buffer, {
    metadata: {
      contentType: file.contentType,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  return {
    id: mediaId,
    name: filename,
    url: buildFirebaseDownloadUrl(bucket.name, storagePath, downloadToken),
    contentType: file.contentType,
    size: file.size,
  };
}

export async function uploadTaskCompletionMedia(
  taskId: string,
  userId: string,
  file: {
    buffer: Buffer;
    originalFilename: string;
    contentType: string;
    size: number;
  },
): Promise<TaskMedia> {
  const mediaId = randomUUID();
  const filename = sanitizeTaskMediaFilename(file.originalFilename);
  const storagePath = getTaskCompletionMediaStoragePath(
    taskId,
    userId,
    mediaId,
    filename,
  );
  const downloadToken = randomUUID();
  const bucket = getAdminStorage().bucket();
  const storageFile = bucket.file(storagePath);

  await storageFile.save(file.buffer, {
    metadata: {
      contentType: file.contentType,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  return {
    id: mediaId,
    name: filename,
    url: buildFirebaseDownloadUrl(bucket.name, storagePath, downloadToken),
    contentType: file.contentType,
    size: file.size,
  };
}

export async function deleteTaskMediaFile(
  taskId: string,
  mediaId: string,
  filename: string,
): Promise<void> {
  const storagePath = getTaskMediaStoragePath(taskId, mediaId, filename);
  const bucket = getAdminStorage().bucket();
  const storageFile = bucket.file(storagePath);

  try {
    await storageFile.delete({ ignoreNotFound: true });
  } catch (error) {
    console.error(`Failed to delete task media file ${storagePath}:`, error);
  }
}

export async function deleteAllTaskMedia(
  taskId: string,
  mediaItems: TaskMedia[],
): Promise<void> {
  await Promise.all(
    mediaItems.map((media) =>
      deleteTaskMediaFile(taskId, media.id, media.name),
    ),
  );
}

export async function deleteTaskCompletionMediaFile(
  taskId: string,
  userId: string,
  mediaId: string,
  filename: string,
): Promise<void> {
  const storagePath = getTaskCompletionMediaStoragePath(
    taskId,
    userId,
    mediaId,
    filename,
  );
  const bucket = getAdminStorage().bucket();
  const storageFile = bucket.file(storagePath);

  try {
    await storageFile.delete({ ignoreNotFound: true });
  } catch (error) {
    console.error(`Failed to delete task completion media file ${storagePath}:`, error);
  }
}

export async function deleteAllTaskCompletionMedia(
  taskId: string,
  userId: string,
  mediaItems: TaskMedia[],
): Promise<void> {
  await Promise.all(
    mediaItems.map((media) =>
      deleteTaskCompletionMediaFile(taskId, userId, media.id, media.name),
    ),
  );
}
