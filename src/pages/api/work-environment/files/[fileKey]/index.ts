import formidable from "formidable";
import fs from "fs/promises";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getFormFieldValue, isNonEmptyStringValue } from "@/lib/taskMediaAuth";
import { canUploadWorkEnvironmentFile } from "@/lib/workEnvironmentAuth";
import { toPublicWorkEnvironmentFile } from "@/lib/workEnvironmentFileMapper";
import { uploadWorkEnvironmentFile } from "@/lib/workEnvironmentFileStorage";
import {
  isAllowedWorkEnvironmentFileContentType,
  MAX_WORK_ENVIRONMENT_FILE_SIZE_BYTES,
  resolveWorkEnvironmentFileContentType,
} from "@/lib/workEnvironmentFileValidation";
import { isWorkEnvironmentFileKey } from "@/types/workEnvironment";
import type {
  FirestoreWorkEnvironmentFile,
  UploadWorkEnvironmentFileErrorResponse,
  UploadWorkEnvironmentFileSuccessResponse,
} from "@/types/workEnvironment";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

type UploadWorkEnvironmentFileResponse =
  | UploadWorkEnvironmentFileSuccessResponse
  | UploadWorkEnvironmentFileErrorResponse;

function parseMultipartForm(req: NextApiRequest) {
  const form = formidable({
    maxFileSize: MAX_WORK_ENVIRONMENT_FILE_SIZE_BYTES,
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
  res: NextApiResponse<UploadWorkEnvironmentFileResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const fileKeyParam =
    typeof req.query.fileKey === "string" ? req.query.fileKey.trim() : "";

  if (!isWorkEnvironmentFileKey(fileKeyParam)) {
    return res.status(400).json({ error: "Invalid file key" });
  }

  const fileKey = fileKeyParam;
  let uploadedFile: formidable.File | null = null;

  try {
    const { fields, files } = await parseMultipartForm(req);
    const userId = getFormFieldValue(fields, "userId");

    if (!isNonEmptyStringValue(userId)) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!(await canUploadWorkEnvironmentFile(fileKey, userId))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    uploadedFile = getUploadedFile(files);
    if (!uploadedFile) {
      return res.status(400).json({ error: "File is required" });
    }

    const originalFilename = uploadedFile.originalFilename ?? "file";
    const contentType = resolveWorkEnvironmentFileContentType(
      uploadedFile.mimetype,
      originalFilename,
    );
    if (!isAllowedWorkEnvironmentFileContentType(fileKey, contentType)) {
      return res.status(400).json({ error: "File type is not allowed" });
    }

    const fileBuffer = await fs.readFile(uploadedFile.filepath);
    const media = await uploadWorkEnvironmentFile(fileKey, {
      buffer: fileBuffer,
      originalFilename,
      contentType,
      size: uploadedFile.size,
    });

    const db = getAdminFirestore();
    const docRef = db.collection("workEnvironmentFiles").doc(fileKey);
    await docRef.set(
      { media, updatedAt: Timestamp.now(), updatedBy: userId },
      { merge: true },
    );

    const updatedDoc = await docRef.get();
    const file = toPublicWorkEnvironmentFile(
      fileKey,
      updatedDoc.data() as FirestoreWorkEnvironmentFile | undefined,
    );

    return res.status(201).json({ file });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("maxFileSize") ||
        error.message.includes("exceeded"))
    ) {
      return res.status(400).json({ error: "File is too large" });
    }

    console.error("Upload work environment file failed:", error);
    return res
      .status(500)
      .json({ error: "Upload work environment file failed" });
  } finally {
    if (uploadedFile?.filepath) {
      await fs.unlink(uploadedFile.filepath).catch(() => undefined);
    }
  }
}
