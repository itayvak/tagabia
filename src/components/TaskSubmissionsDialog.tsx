import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DownloadIcon from "@mui/icons-material/Download";
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
import TaskMediaAttachments from "@/components/TaskMediaAttachments";
import { downloadTaskSubmissionsCsv } from "@/lib/taskSubmissionsCsv";
import { formatSubmissionAnswer } from "@/lib/formatSubmissionAnswer";
import { formatDueDate } from "@/lib/taskDate";
import type { TaskFormField, TaskSubmissionEntry } from "@/types/taskForm";

interface TaskSubmissionsDialogProps {
  open: boolean;
  taskTitle: string;
  isLoading: boolean;
  formFields: TaskFormField[];
  submissions: TaskSubmissionEntry[];
  totalAssignees?: number;
  initialUserId?: string | null;
  onClose: () => void;
}

export default function TaskSubmissionsDialog({
  open,
  taskTitle,
  isLoading,
  formFields,
  submissions,
  totalAssignees,
  initialUserId = null,
  onClose,
}: TaskSubmissionsDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialUserId && submissions.length > 0) {
      const index = submissions.findIndex(
        (submission) => submission.userId === initialUserId,
      );
      setCurrentIndex(index >= 0 ? index : 0);
      return;
    }

    setCurrentIndex(0);
  }, [open, initialUserId, submissions]);

  useEffect(() => {
    if (currentIndex >= submissions.length && submissions.length > 0) {
      setCurrentIndex(submissions.length - 1);
    }
  }, [currentIndex, submissions.length]);

  const currentSubmission =
    submissions.length > 0 ? submissions[currentIndex] : null;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < submissions.length - 1;
  const assigneeTotal = totalAssignees ?? submissions.length;
  const hasFormFields = formFields.length > 0;
  const hasAnyMedia = submissions.some((submission) => submission.media.length > 0);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>הגשות מטלה</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {taskTitle}
        </Typography>
        {!isLoading && assigneeTotal > 0 ? (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {submissions.length} מתוך {assigneeTotal} ממונים הגישו
          </Typography>
        ) : null}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : submissions.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
            אין עדיין הגשות למטלה זו
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
              {hasFormFields
                ? formFields.map((field) => (
                    <Box key={field.id}>
                      <Typography variant="subtitle2" gutterBottom>
                        {field.label}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {formatSubmissionAnswer(field, currentSubmission.answers)}
                      </Typography>
                    </Box>
                  ))
                : null}
              {currentSubmission.media.length > 0 ? (
                <TaskMediaAttachments media={currentSubmission.media} />
              ) : hasAnyMedia ? (
                <Typography variant="body2" color="text.secondary">
                  לא צורפו קבצים בהגשה זו.
                </Typography>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!isLoading && submissions.length > 0 && hasFormFields ? (
          <Button
            startIcon={<DownloadIcon />}
            onClick={() =>
              downloadTaskSubmissionsCsv(taskTitle, formFields, submissions)
            }
          >
            ייצוא CSV
          </Button>
        ) : null}
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}
