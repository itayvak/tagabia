import { randomUUID } from "crypto";
import { getAdminStorage } from "@/lib/firebaseAdmin";
import { sanitizeTaskMediaFilename } from "@/lib/taskMediaValidation";
import type { TaskMedia } from "@/types/task";
import type { WorkEnvironmentFileKey } from "@/types/workEnvironment";

function getWorkEnvironmentFileStoragePath(
  fileKey: WorkEnvironmentFileKey,
  mediaId: string,
  filename: string,
): string {
  return `workEnvironmentFiles/${fileKey}/${mediaId}/${filename}`;
}

function buildFirebaseDownloadUrl(
  bucketName: string,
  storagePath: string,
  downloadToken: string,
): string {
  const encodedPath = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;
}

export async function uploadWorkEnvironmentFile(
  fileKey: WorkEnvironmentFileKey,
  file: {
    buffer: Buffer;
    originalFilename: string;
    contentType: string;
    size: number;
  },
): Promise<TaskMedia> {
  const mediaId = randomUUID();
  const filename = sanitizeTaskMediaFilename(file.originalFilename);
  const storagePath = getWorkEnvironmentFileStoragePath(
    fileKey,
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
