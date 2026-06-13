import { FormEvent, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import TaskAssigneePicker from "@/components/TaskAssigneePicker";
import {
  createEmptyAssigneeSelection,
  hasAssigneeSelection,
  type AssigneeSelection,
} from "@/lib/platoons";
import {
  deriveAssigneeSelection,
  resolveAssignees,
} from "@/lib/resolveAssigneesClient";

export interface TaskFormData {
  title: string;
  content: string;
  dueDate: string;
  assignees: string[];
}

interface TaskFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  isSubmitting: boolean;
  initialValues?: TaskFormData;
  onClose: () => void;
  onSubmit: (task: TaskFormData) => void;
  onError?: (message: string) => void;
}

const emptyForm: TaskFormData = {
  title: "",
  content: "",
  dueDate: "",
  assignees: [],
};

export default function TaskFormDialog({
  open,
  mode,
  isSubmitting,
  initialValues,
  onClose,
  onSubmit,
  onError,
}: TaskFormDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeSelection, setAssigneeSelection] = useState<AssigneeSelection>(
    createEmptyAssigneeSelection(),
  );
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [assigneeCount, setAssigneeCount] = useState<number | null>(null);
  const [isResolvingAssignees, setIsResolvingAssignees] = useState(false);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
      setDueDate("");
      setAssigneeSelection(createEmptyAssigneeSelection());
      setAssigneeIds([]);
      setAssigneeCount(null);
      setIsResolvingAssignees(false);
      setIsLoadingAssignees(false);
      return;
    }

    if (initialValues) {
      setTitle(initialValues.title);
      setContent(initialValues.content);
      setDueDate(initialValues.dueDate);
      setAssigneeIds(initialValues.assignees);
      setAssigneeCount(initialValues.assignees.length);
      setAssigneeSelection(createEmptyAssigneeSelection());

      let cancelled = false;
      setIsLoadingAssignees(true);

      const loadAssigneeSelection = async () => {
        try {
          const { response, data } = await deriveAssigneeSelection(
            initialValues.assignees,
          );

          if (cancelled) {
            return;
          }

          if (!response.ok) {
            setAssigneeSelection(createEmptyAssigneeSelection());
            onError?.("שגיאה בטעינת שיוך החיילים");
            return;
          }

          setAssigneeSelection(
            (data as { selection: AssigneeSelection }).selection,
          );
        } catch {
          if (!cancelled) {
            setAssigneeSelection(createEmptyAssigneeSelection());
            onError?.("שגיאה בטעינת שיוך החיילים");
          }
        } finally {
          if (!cancelled) {
            setIsLoadingAssignees(false);
          }
        }
      };

      void loadAssigneeSelection();

      return () => {
        cancelled = true;
      };
    }

    setTitle(emptyForm.title);
    setContent(emptyForm.content);
    setDueDate(emptyForm.dueDate);
    setAssigneeSelection(createEmptyAssigneeSelection());
    setAssigneeIds([]);
    setAssigneeCount(null);
  }, [open, initialValues, onError]);

  useEffect(() => {
    if (!open || isLoadingAssignees) {
      return;
    }

    if (!hasAssigneeSelection(assigneeSelection)) {
      setAssigneeIds([]);
      setAssigneeCount(null);
      setIsResolvingAssignees(false);
      return;
    }

    let cancelled = false;
    setIsResolvingAssignees(true);

    const resolveSelection = async () => {
      try {
        const { response, data } = await resolveAssignees(assigneeSelection);

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setAssigneeIds([]);
          setAssigneeCount(null);
          onError?.("שגיאה בחישוב החיילים שנבחרו");
          return;
        }

        const { assigneeIds: resolvedIds } = data as {
          assigneeIds: string[];
        };
        setAssigneeIds(resolvedIds);
        setAssigneeCount(resolvedIds.length);
      } catch {
        if (!cancelled) {
          setAssigneeIds([]);
          setAssigneeCount(null);
          onError?.("שגיאה בחישוב החיילים שנבחרו");
        }
      } finally {
        if (!cancelled) {
          setIsResolvingAssignees(false);
        }
      }
    };

    void resolveSelection();

    return () => {
      cancelled = true;
    };
  }, [assigneeSelection, isLoadingAssignees, onError, open]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasAssigneeSelection(assigneeSelection)) {
      onError?.("יש לבחור לפחות פלוגה או צוות אחד");
      return;
    }

    if (isLoadingAssignees || isResolvingAssignees || assigneeIds.length === 0) {
      onError?.("לא נמצאו חיילים עבור הבחירה");
      return;
    }

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      dueDate,
      assignees: assigneeIds,
    });
  };

  const isCreate = mode === "create";
  const formId = isCreate ? "create-task-form" : "edit-task-form";
  const isAssigneeBusy = isLoadingAssignees || isResolvingAssignees;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{isCreate ? "מטלה חדשה" : "עריכת מטלה"}</DialogTitle>
      <Box component="form" id={formId} onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
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
            selection={assigneeSelection}
            onChange={setAssigneeSelection}
            assigneeCount={assigneeCount}
            isResolving={isAssigneeBusy}
            disabled={isSubmitting || isLoadingAssignees}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="contained"
            disabled={isSubmitting || isAssigneeBusy}
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
        </DialogActions>
      </Box>
    </Dialog>
  );
}
