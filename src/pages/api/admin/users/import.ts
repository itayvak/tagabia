import { getAdminUserId } from "@/lib/admin";
import { canAccessAdminByUserId } from "@/lib/adminAccess";
import { parseCsv } from "@/lib/csv";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import {
  parseUserCsvRow,
  USER_CSV_HEADERS,
  usersAreEqual,
} from "@/lib/userCsv";
import type {
  FirestoreUser,
  ImportUsersErrorResponse,
  ImportUsersRequestBody,
  ImportUsersSuccessResponse,
} from "@/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

type ImportUsersResponse = ImportUsersSuccessResponse | ImportUsersErrorResponse;

const BATCH_LIMIT = 500;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImportUsersResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, csv } = req.body as Partial<ImportUsersRequestBody>;

  if (!isNonEmptyString(userId)) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!isNonEmptyString(csv)) {
    return res.status(400).json({ error: "CSV content is required" });
  }

  if (!(await canAccessAdminByUserId(userId.trim()))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const rows = parseCsv(csv);
    if (rows.length === 0) {
      return res.status(400).json({ error: "CSV file is empty" });
    }

    const [headerRow, ...dataRows] = rows;
    const normalizedHeaders = headerRow.map((header) => header.trim());

    if (
      normalizedHeaders.length !== USER_CSV_HEADERS.length ||
      !USER_CSV_HEADERS.every(
        (header, index) => header === normalizedHeaders[index],
      )
    ) {
      return res.status(400).json({ error: "Invalid CSV headers" });
    }

    const parsedUsers: { id: string; data: FirestoreUser }[] = [];
    const seenIds = new Set<string>();

    for (let index = 0; index < dataRows.length; index += 1) {
      const parsed = parseUserCsvRow(dataRows[index], index + 2);

      if ("error" in parsed) {
        return res.status(400).json({ error: parsed.error });
      }

      if (seenIds.has(parsed.user.id)) {
        return res.status(400).json({
          error: `Row ${index + 2}: duplicate id ${parsed.user.id}`,
        });
      }

      seenIds.add(parsed.user.id);
      parsedUsers.push(parsed.user);
    }

    const db = getAdminFirestore();
    const allUsersSnapshot = await db.collection("users").get();
    const existingById = new Map(
      allUsersSnapshot.docs.map((doc) => [
        doc.id,
        doc.data() as FirestoreUser,
      ]),
    );
    const csvIds = new Set(parsedUsers.map((user) => user.id));
    const adminUserId = getAdminUserId();

    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let deleted = 0;
    let batch = db.batch();
    let batchCount = 0;

    const commitBatch = async () => {
      if (batchCount === 0) {
        return;
      }

      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    };

    for (const { id, data } of parsedUsers) {
      const existing = existingById.get(id);

      if (!existing) {
        batch.set(db.collection("users").doc(id), data);
        created += 1;
      } else if (usersAreEqual(existing, data)) {
        unchanged += 1;
        continue;
      } else {
        batch.set(db.collection("users").doc(id), { ...existing, ...data });
        updated += 1;
      }

      batchCount += 1;

      if (batchCount === BATCH_LIMIT) {
        await commitBatch();
      }
    }

    for (const doc of allUsersSnapshot.docs) {
      if (csvIds.has(doc.id) || doc.id === adminUserId) {
        continue;
      }

      batch.delete(doc.ref);
      deleted += 1;
      batchCount += 1;

      if (batchCount === BATCH_LIMIT) {
        await commitBatch();
      }
    }

    await commitBatch();

    return res.status(200).json({ created, updated, unchanged, deleted });
  } catch (error) {
    console.error("Import users failed:", error);
    return res.status(500).json({ error: "Import users failed" });
  }
}
