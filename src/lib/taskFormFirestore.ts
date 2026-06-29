import type { TaskFormField, TaskFormFieldInput } from "@/types/taskForm";
import type { Firestore } from "firebase-admin/firestore";

export async function loadTaskFormFields(
  db: Firestore,
  taskId: string,
): Promise<TaskFormField[]> {
  const snapshot = await db
    .collection("tasks")
    .doc(taskId)
    .collection("formFields")
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const type = data.type;
      const label = typeof data.label === "string" ? data.label.trim() : "";
      const required = data.required === true;
      const order =
        typeof data.order === "number" && Number.isFinite(data.order)
          ? data.order
          : 0;

      if (type !== "text" && type !== "multipleChoice" && type !== "multiSelect") {
        return null;
      }

      if (!label) {
        return null;
      }

      const field: TaskFormField = {
        id: doc.id,
        type,
        label,
        required,
        order,
      };

      if (
        (type === "multipleChoice" || type === "multiSelect") &&
        Array.isArray(data.options)
      ) {
        const options = data.options
          .filter((option): option is string => typeof option === "string")
          .map((option) => option.trim())
          .filter((option) => option.length > 0);

        if (options.length >= 2) {
          field.options = options;
        }
      }

      return field;
    })
    .filter((field): field is TaskFormField => field !== null)
    .sort((a, b) => a.order - b.order);
}

export async function syncTaskFormFields(
  db: Firestore,
  taskId: string,
  formFields: TaskFormFieldInput[],
): Promise<void> {
  const taskRef = db.collection("tasks").doc(taskId);
  const formFieldsRef = taskRef.collection("formFields");
  const existingSnapshot = await formFieldsRef.get();
  const requestedIds = new Set(
    formFields
      .map((field) => field.id?.trim())
      .filter((id): id is string => Boolean(id)),
  );

  const batch = db.batch();

  existingSnapshot.docs.forEach((doc) => {
    if (!requestedIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  formFields.forEach((field) => {
    const docRef = field.id
      ? formFieldsRef.doc(field.id)
      : formFieldsRef.doc();

    const data: Record<string, unknown> = {
      type: field.type,
      label: field.label,
      required: field.required,
      order: field.order,
    };

    if (
      (field.type === "multipleChoice" || field.type === "multiSelect") &&
      field.options
    ) {
      data.options = field.options;
    }

    batch.set(docRef, data);
  });

  batch.update(taskRef, { hasFormFields: formFields.length > 0 });
  await batch.commit();
}

export async function deleteTaskSubcollection(
  db: Firestore,
  taskRef: FirebaseFirestore.DocumentReference,
  subcollectionName: string,
): Promise<void> {
  const snapshot = await taskRef.collection(subcollectionName).get();
  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}
