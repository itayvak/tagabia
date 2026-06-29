import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import { formatSubmissionAnswer } from "@/lib/formatSubmissionAnswer";
import { formatDueDate } from "@/lib/taskDate";
import type { TaskFormField, TaskSubmissionEntry } from "@/types/taskForm";

interface TaskSubmissionsDialogProps {
  open: boolean;
  taskTitle: string;
  isLoading: boolean;
  formFields: TaskFormField[];
  submissions: TaskSubmissionEntry[];
  onClose: () => void;
}

export default function TaskSubmissionsDialog({
  open,
  taskTitle,
  isLoading,
  formFields,
  submissions,
  onClose,
}: TaskSubmissionsDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (currentIndex >= submissions.length && submissions.length > 0) {
      setCurrentIndex(submissions.length - 1);
    }
  }, [currentIndex, submissions.length]);

  const currentSubmission =
    submissions.length > 0 ? submissions[currentIndex] : null;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < submissions.length - 1;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>תשובות לטופס</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {taskTitle}
        </Typography>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : submissions.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
            אין עדיין תשובות לטופס זה
          </Typography>
        ) : currentSubmission ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                תשובה {currentIndex + 1} מתוך {submissions.length}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={!hasPrevious}
                  onClick={() => setCurrentIndex((index) => index - 1)}
                  startIcon={<ChevronRightIcon />}
                >
                  הקודם
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={!hasNext}
                  onClick={() => setCurrentIndex((index) => index + 1)}
                  endIcon={<ChevronLeftIcon />}
                >
                  הבא
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle1">
                {currentSubmission.completerRank}{" "}
                {currentSubmission.completerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                נשלח ב-{formatDueDate(currentSubmission.submittedAt)}
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {formFields.map((field) => (
                <Box key={field.id}>
                  <Typography variant="subtitle2" gutterBottom>
                    {field.label}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {formatSubmissionAnswer(field, currentSubmission.answers)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}
