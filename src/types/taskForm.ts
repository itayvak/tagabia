export type TaskFormFieldType = "text" | "multipleChoice" | "multiSelect";

export interface TaskFormField {
  id: string;
  type: TaskFormFieldType;
  label: string;
  required: boolean;
  order: number;
  options?: string[];
}

export interface TaskFormFieldInput {
  id?: string;
  type: TaskFormFieldType;
  label: string;
  required: boolean;
  order: number;
  options?: string[];
}

export interface FirestoreTaskSubmission {
  submittedAt: import("firebase-admin/firestore").Timestamp;
  completerName: string;
  completerRank: string;
  answers: Record<string, string>;
}

export interface TaskSubmission {
  submittedAt: string;
  completerName: string;
  completerRank: string;
  answers: Record<string, string>;
}

export interface TaskSubmissionEntry extends TaskSubmission {
  userId: string;
}

export interface ListTaskSubmissionsSuccessResponse {
  formFields: TaskFormField[];
  submissions: TaskSubmissionEntry[];
}

export interface ListTaskSubmissionsErrorResponse {
  error: string;
}
