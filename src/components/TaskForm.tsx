import { FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
} from "@mui/material";
import TaskAssigneePicker from "@/components/TaskAssigneePicker";
import TaskCategoryPicker from "@/components/TaskCategoryPicker";
import TaskFormFieldBuilder, {
  toBuilderFormFields,
  toFormFieldInputs,
  validateBuilderFields,
  type BuilderFormField,
} from "@/components/TaskFormFieldBuilder";
import TaskMediaUpload from "@/components/TaskMediaUpload";
import { hasTaskAssignment } from "@/lib/assigneeTeams";
import {
  DEFAULT_TASK_CATEGORY,
  type TaskCategory,
} from "@/lib/taskCategory";
import type { TaskMedia } from "@/types/task";
import type { TaskFormFieldInput } from "@/types/taskForm";

export interface TaskFormData {
  title: string;
  content: string;
  category: TaskCategory;
  dueDate: string;
  assignedTeams: number[];
  assignedUsers: string[];
  formFields: TaskFormFieldInput[];
  pendingMedia: File[];
}

interface TaskFormProps {
  mode: "create" | "edit";
  isSubmitting: boolean;
  isUploadingMedia?: boolean;
  taskId?: string;
  userId?: string;
  initialValues?: TaskFormData;
  initialMedia?: TaskMedia[];
  formFieldsWarningMessage?: string | null;
  onCancel: () => void;
  onSubmit: (task: TaskFormData) => void;
  onError?: (message: string) => void;
}

const emptyForm: TaskFormData = {
  title: "",
  content: "",
  category: DEFAULT_TASK_CATEGORY,
  dueDate: "",
  assignedTeams: [],
  assignedUsers: [],
  formFields: [],
  pendingMedia: [],
};

export default function TaskForm({
  mode,
  isSubmitting,
  isUploadingMedia = false,
  taskId,
  userId,
  initialValues,
  initialMedia = [],
  formFieldsWarningMessage = null,
  onCancel,
  onSubmit,
  onError,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<TaskCategory | null>(() =>
    mode === "create" ? null : DEFAULT_TASK_CATEGORY,
  );
  const [dueDate, setDueDate] = useState("");
  const [assignedTeams, setAssignedTeams] = useState<number[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [formFields, setFormFields] = useState<BuilderFormField[]>([]);
  const [pendingMedia, setPendingMedia] = useState<File[]>([]);

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    setTitle(initialValues.title);
    setContent(initialValues.content);
    setCategory(initialValues.category);
    setDueDate(initialValues.dueDate);
    setAssignedTeams(initialValues.assignedTeams);
    setAssignedUsers(initialValues.assignedUsers);
    setFormFields(toBuilderFormFields(initialValues.formFields));
    setPendingMedia(initialValues.pendingMedia);
  }, [initialValues]);

  const handleCancel = () => {
    if (isSubmitting) {
      return;
    }

    onCancel();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!category) {
      onError?.("יש לבחור קטגוריה");
      return;
    }

    if (!hasTaskAssignment(assignedTeams, assignedUsers)) {
      onError?.("יש לבחור לפחות צוות או צוער אחד");
      return;
    }

    const formFieldsError = validateBuilderFields(formFields);
    if (formFieldsError) {
      onError?.(formFieldsError);
      return;
    }

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      category,
      dueDate,
      assignedTeams,
      assignedUsers,
      formFields: toFormFieldInputs(formFields),
      pendingMedia,
    });
  };

  const isCreate = mode === "create";
  const formId = isCreate ? "create-task-form" : "edit-task-form";
  const isFormBusy = isSubmitting || isUploadingMedia;

  const assigneePicker = (
    <TaskAssigneePicker
      assignedTeams={assignedTeams}
      assignedUsers={assignedUsers}
      onChange={({ assignedTeams: nextTeams, assignedUsers: nextUsers }) => {
        setAssignedTeams(nextTeams);
        setAssignedUsers(nextUsers);
      }}
      disabled={isFormBusy}
    />
  );

  return (
    <Box
      component="form"
      id={formId}
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TaskCategoryPicker
        value={category}
        onChange={setCategory}
        disabled={isFormBusy}
        autoOpen={isCreate}
        requireSelection={isCreate}
      />
      <TextField
        label="כותרת"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        fullWidth
        autoFocus={!isCreate || category !== null}
        disabled={isFormBusy}
        slotProps={{
          htmlInput: { dir: "rtl" },
        }}
      />
      <TextField
        label="תוכן"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        fullWidth
        multiline
        minRows={3}
        disabled={isFormBusy}
        slotProps={{
          htmlInput: { dir: "rtl" },
        }}
      />
      <TextField
        label='תג"ב'
        type="datetime-local"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
        required
        fullWidth
        disabled={isFormBusy}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { dir: "ltr" },
        }}
      />
      <TaskMediaUpload
        mode={mode}
        disabled={isFormBusy}
        taskId={taskId}
        userId={userId}
        initialMedia={initialMedia}
        pendingMedia={pendingMedia}
        onPendingMediaChange={setPendingMedia}
        onError={onError}
      />
      {!isCreate ? assigneePicker : null}
      {formFieldsWarningMessage ? (
        <Alert severity="warning">{formFieldsWarningMessage}</Alert>
      ) : null}
      <TaskFormFieldBuilder
        fields={formFields}
        onChange={setFormFields}
        disabled={isFormBusy}
      />
      {isCreate ? assigneePicker : null}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 1 }}>
        <Button onClick={handleCancel} disabled={isFormBusy}>
          ביטול
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isFormBusy}
          startIcon={
            isFormBusy ? (
              <CircularProgress size={20} color="inherit" />
            ) : undefined
          }
        >
          {isUploadingMedia
            ? "מעלה קבצים..."
            : isSubmitting
              ? isCreate
                ? "יוצר..."
                : "שומר..."
              : isCreate
                ? "שיוך מטלה"
                : "שמירה"}
        </Button>
      </Box>
    </Box>
  );
}
