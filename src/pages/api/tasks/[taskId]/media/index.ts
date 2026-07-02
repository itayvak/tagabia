import formidable from "formidable";
import fs from "fs/promises";
import type { NextApiRequest } from "next";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import {
  getFormFieldValue,
  isNonEmptyStringValue,
  verifyTaskCreator,
} from "@/lib/taskMediaAuth";
import { uploadTaskMedia } from "@/lib/taskMediaStorage";
import {
  isAllowedTaskMediaContentType,
  MAX_TASK_MEDIA_FILES,
  MAX_TASK_MEDIA_FILE_SIZE_BYTES,
  resolveTaskMediaContentType,
} from "@/lib/taskMediaValidation";
import type { TaskMedia } from "@/types/task";
import type { NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadTaskMediaSuccessResponse {
  media: TaskMedia;
}

interface UploadTaskMediaErrorResponse {
  error: string;
}

type UploadTaskMediaResponse =
  | UploadTaskMediaSuccessResponse
  | UploadTaskMediaErrorResponse;

function parseMultipartForm(req: NextApiRequest) {
  const form = formidable({
    maxFileSize: MAX_TASK_MEDIA_FILE_SIZE_BYTES,
    maxFiles: 1,
  });

  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      form.parse(req, (error, fields, files) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({ fields, files });
      });
    },
  );
}

function getUploadedFile(files: formidable.Files): formidable.File | null {
  const fileField = files.file;
  if (!fileField) {
    return null;
  }

  if (Array.isArray(fileField)) {
    return fileField[0] ?? null;
  }

  return fileField;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadTaskMediaResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const taskId =
    typeof req.query.taskId === "string" ? req.query.taskId.trim() : "";

  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required" });
  }

  let uploadedFile: formidable.File | null = null;

  try {
    const { fields, files } = await parseMultipartForm(req);
    const userId = getFormFieldValue(fields, "userId");

    if (!isNonEmptyStringValue(userId)) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const creatorCheck = await verifyTaskCreator(taskId, userId);
    if (!creatorCheck.ok) {
      return res.status(creatorCheck.status).json({ error: creatorCheck.error });
    }

    if (creatorCheck.media.length >= MAX_TASK_MEDIA_FILES) {
      return res.status(400).json({ error: "Maximum number of media files reached" });
    }

    uploadedFile = getUploadedFile(files);
    if (!uploadedFile) {
      return res.status(400).json({ error: "File is required" });
    }

    const originalFilename = uploadedFile.originalFilename ?? "file";
    const contentType = resolveTaskMediaContentType(
      uploadedFile.mimetype,
      originalFilename,
    );
    if (!isAllowedTaskMediaContentType(contentType)) {
      return res.status(400).json({ error: "File type is not allowed" });
    }

    const fileBuffer = await fs.readFile(uploadedFile.filepath);
    const media = await uploadTaskMedia(taskId, {
      buffer: fileBuffer,
      originalFilename,
      contentType,
      size: uploadedFile.size,
    });

    const db = getAdminFirestore();
    await db
      .collection("tasks")
      .doc(taskId)
      .update({ media: [...creatorCheck.media, media] });

    return res.status(201).json({ media });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("maxFileSize") ||
        error.message.includes("exceeded"))
    ) {
      return res.status(400).json({ error: "File is too large" });
    }

    console.error("Upload task media failed:", error);
    return res.status(500).json({ error: "Upload task media failed" });
  } finally {
    if (uploadedFile?.filepath) {
      await fs.unlink(uploadedFile.filepath).catch(() => undefined);
    }
  }
}
