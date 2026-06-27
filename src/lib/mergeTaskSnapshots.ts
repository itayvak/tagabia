import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

export function mergeTaskSnapshotDocs(
  ...snapshots: Array<{ docs: QueryDocumentSnapshot[] }>
): QueryDocumentSnapshot[] {
  const docsById = new Map<string, QueryDocumentSnapshot>();

  for (const snapshot of snapshots) {
    for (const doc of snapshot.docs) {
      docsById.set(doc.id, doc);
    }
  }

  return [...docsById.values()];
}
