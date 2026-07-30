import { FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import TaskAssigneePicker from "@/components/TaskAssigneePicker";
import TaskCategoryPicker from "@/components/TaskCategoryPicker";
import TaskFormFieldBuilder, {
  toBuilderFormFields,
  toFormFieldInputs,
  type BuilderFormField,
} from "@/components/TaskFormFieldBuilder";
import TaskFormSection from "@/components/TaskFormSection";
import TaskMediaUpload from "@/components/TaskMediaUpload";
import {
  DEFAULT_TASK_CATEGORY,
  type TaskCategory,
} from "@/lib/taskCategory";
import { fromDatetimeLocalValue } from "@/lib/taskDate";
import {
  MAX_TASK_COMPLETION_MEDIA_FILES,
  TASK_COMPLETION_MEDIA_FILE_OPTIONS,
} from "@/lib/taskCompletionMedia";
import { getTaskErrorMessage } from "@/lib/taskErrorMessages";
import { validateTaskFormData } from "@/lib/validateTaskForm";
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
  allowCompletionFileUpload: boolean;
  requireCompletionFileUpload: boolean;
  completionFileUploadMax: number;
  requiresCampusSubmission: boolean;
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
  const [allowCompletionFileUpload, setAllowCompletionFileUpload] = useState(false);
  const [requireCompletionFileUpload, setRequireCompletionFileUpload] = useState(false);
  const [completionFileUploadMax, setCompletionFileUploadMax] = useState(
    MAX_TASK_COMPLETION_MEDIA_FILES,
  );
  const [requiresCampusSubmission, setRequiresCampusSubmission] = useState(false);

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
    setAllowCompletionFileUpload(initialValues.allowCompletionFileUpload);
    setRequireCompletionFileUpload(initialValues.requireCompletionFileUpload);
    setCompletionFileUploadMax(initialValues.completionFileUploadMax);
    setRequiresCampusSubmission(initialValues.requiresCampusSubmission);
  }, [initialValues]);

  const handleCancel = () => {
    if (isSubmitting) {
      return;
    }

    onCancel();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateTaskFormData({
      title,
      category,
      dueDate,
      assignedTeams,
      assignedUsers,
      formFields: toFormFieldInputs(formFields),
    });

    if (!validation.ok) {
      onError?.(getTaskErrorMessage(validation.error));
      return;
    }

    const validatedCategory = category;
    if (!validatedCategory) {
      return;
    }

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      category: validatedCategory,
      dueDate: fromDatetimeLocalValue(dueDate),
      assignedTeams,
      assignedUsers,
      formFields: toFormFieldInputs(formFields),
      pendingMedia,
      allowCompletionFileUpload,
      requireCompletionFileUpload: allowCompletionFileUpload && requireCompletionFileUpload,
      completionFileUploadMax,
      requiresCampusSubmission,
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
      hideTitle
    />
  );

  const generalFields = (
    <>
      <TaskCategoryPicker
        value={category}
        onChange={setCategory}
        disabled={isFormBusy}
        autoOpen={isCreate}
      />
      <TextField
        label="כותרת"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
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
        fullWidth
        disabled={isFormBusy}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { dir: "ltr" },
        }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={requiresCampusSubmission}
            onChange={(event) => setRequiresCampusSubmission(event.target.checked)}
            disabled={isFormBusy}
          />
        }
        label="יש להגיש בקמפוס"
      />
    </>
  );

  const mediaUpload = (
    <TaskMediaUpload
      mode={mode}
      disabled={isFormBusy}
      hideTitle
      taskId={taskId}
      userId={userId}
      initialMedia={initialMedia}
      pendingMedia={pendingMedia}
      onPendingMediaChange={setPendingMedia}
      onError={onError}
    />
  );

  const completionUploadOptions = (
    <>
      <FormControlLabel
        control={
          <Checkbox
            checked={allowCompletionFileUpload}
            onChange={(event) => {
              const checked = event.target.checked;
              setAllowCompletionFileUpload(checked);
              if (!checked) {
                setRequireCompletionFileUpload(false);
              }
            }}
            disabled={isFormBusy}
          />
        }
        label="לאפשר העלאת קבצים בהגשת המטלה"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={requireCompletionFileUpload}
            onChange={(event) => setRequireCompletionFileUpload(event.target.checked)}
            disabled={isFormBusy || !allowCompletionFileUpload}
          />
        }
        label="לחייב העלאת קובץ כדי להשלים את המטלה"
      />
      <TextField
        select
        fullWidth
        size="small"
        label="כמות קבצים מקסימלית"
        value={completionFileUploadMax}
        onChange={(event) =>
          setCompletionFileUploadMax(Number(event.target.value))
        }
        disabled={isFormBusy || !allowCompletionFileUpload}
        helperText={`ניתן לבחור עד ${MAX_TASK_COMPLETION_MEDIA_FILES} קבצים`}
      >
        {TASK_COMPLETION_MEDIA_FILE_OPTIONS.map((count) => (
          <MenuItem key={count} value={count}>
            {count}
          </MenuItem>
        ))}
      </TextField>
    </>
  );

  const formFieldBuilder = (
    <>
      {formFieldsWarningMessage ? (
        <Alert severity="warning">{formFieldsWarningMessage}</Alert>
      ) : null}
      <TaskFormFieldBuilder
        fields={formFields}
        onChange={setFormFields}
        disabled={isFormBusy}
        hideTitle
      />
    </>
  );

  const submitActions = (
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
  );

  return (
    <Box
      component="form"
      id={formId}
      noValidate
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
    >
      <TaskFormSection title="כללי" defaultExpanded>
        {generalFields}
      </TaskFormSection>
      <TaskFormSection title="סקרים">{formFieldBuilder}</TaskFormSection>
      <TaskFormSection title="הגשת קבצים">
        {completionUploadOptions}
      </TaskFormSection>
      <TaskFormSection title="קבצים מצורפים">{mediaUpload}</TaskFormSection>
      <TaskFormSection title="שיוך לצוערים">{assigneePicker}</TaskFormSection>
      {submitActions}
    </Box>
  );
}
