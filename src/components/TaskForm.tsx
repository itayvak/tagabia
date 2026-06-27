import { FormEvent, useEffect, useState } from "react";
import { Box, Button, CircularProgress, TextField } from "@mui/material";
import TaskAssigneePicker from "@/components/TaskAssigneePicker";
import { hasTaskAssignment } from "@/lib/assigneeTeams";

export interface TaskFormData {
  title: string;
  content: string;
  dueDate: string;
  assignedTeams: number[];
  assignedUsers: string[];
}

interface TaskFormProps {
  mode: "create" | "edit";
  isSubmitting: boolean;
  initialValues?: TaskFormData;
  onCancel: () => void;
  onSubmit: (task: TaskFormData) => void;
  onError?: (message: string) => void;
}

const emptyForm: TaskFormData = {
  title: "",
  content: "",
  dueDate: "",
  assignedTeams: [],
  assignedUsers: [],
};

export default function TaskForm({
  mode,
  isSubmitting,
  initialValues,
  onCancel,
  onSubmit,
  onError,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTeams, setAssignedTeams] = useState<number[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title);
      setContent(initialValues.content);
      setDueDate(initialValues.dueDate);
      setAssignedTeams(initialValues.assignedTeams);
      setAssignedUsers(initialValues.assignedUsers);
      return;
    }

    setTitle(emptyForm.title);
    setContent(emptyForm.content);
    setDueDate(emptyForm.dueDate);
    setAssignedTeams(emptyForm.assignedTeams);
    setAssignedUsers(emptyForm.assignedUsers);
  }, [initialValues]);

  const handleCancel = () => {
    if (isSubmitting) {
      return;
    }

    onCancel();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasTaskAssignment(assignedTeams, assignedUsers)) {
      onError?.("יש לבחור לפחות צוות או צוער אחד");
      return;
    }

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      dueDate,
      assignedTeams,
      assignedUsers,
    });
  };

  const isCreate = mode === "create";
  const formId = isCreate ? "create-task-form" : "edit-task-form";

  return (
    <Box
      component="form"
      id={formId}
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        label="כותרת"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        fullWidth
        autoFocus
        disabled={isSubmitting}
        slotProps={{
          htmlInput: { dir: "rtl" },
        }}
      />
      <TextField
        label="תוכן"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        required
        fullWidth
        multiline
        minRows={3}
        disabled={isSubmitting}
        slotProps={{
          htmlInput: { dir: "rtl" },
        }}
      />
      <TextField
        label="תאריך ושעת יעד"
        type="datetime-local"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
        required
        fullWidth
        disabled={isSubmitting}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { dir: "ltr" },
        }}
      />
      <TaskAssigneePicker
        assignedTeams={assignedTeams}
        assignedUsers={assignedUsers}
        onChange={({ assignedTeams: nextTeams, assignedUsers: nextUsers }) => {
          setAssignedTeams(nextTeams);
          setAssignedUsers(nextUsers);
        }}
        disabled={isSubmitting}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 1 }}>
        <Button onClick={handleCancel} disabled={isSubmitting}>
          ביטול
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : undefined
          }
        >
          {isSubmitting
            ? isCreate
              ? "יוצר..."
              : "שומר..."
            : isCreate
              ? "יצירה"
              : "שמירה"}
        </Button>
      </Box>
    </Box>
  );
}
