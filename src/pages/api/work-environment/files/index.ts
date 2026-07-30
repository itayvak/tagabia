import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { toPublicWorkEnvironmentFile } from "@/lib/workEnvironmentFileMapper";
import { WORK_ENVIRONMENT_FILE_KEYS } from "@/types/workEnvironment";
import type {
  FirestoreWorkEnvironmentFile,
  ListWorkEnvironmentFilesErrorResponse,
  ListWorkEnvironmentFilesSuccessResponse,
} from "@/types/workEnvironment";
import type { NextApiRequest, NextApiResponse } from "next";

type ListWorkEnvironmentFilesResponse =
  | ListWorkEnvironmentFilesSuccessResponse
  | ListWorkEnvironmentFilesErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListWorkEnvironmentFilesResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = getAdminFirestore();
    const docs = await Promise.all(
      WORK_ENVIRONMENT_FILE_KEYS.map((key) =>
        db.collection("workEnvironmentFiles").doc(key).get(),
      ),
    );

    const files = docs.map((doc, index) =>
      toPublicWorkEnvironmentFile(
        WORK_ENVIRONMENT_FILE_KEYS[index],
        doc.data() as FirestoreWorkEnvironmentFile | undefined,
      ),
    );

    return res.status(200).json({ files });
  } catch (error) {
    console.error("List work environment files failed:", error);
    return res
      .status(500)
      .json({ error: "List work environment files failed" });
  }
}
