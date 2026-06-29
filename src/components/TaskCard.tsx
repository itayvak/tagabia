import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DescriptionIcon from "@mui/icons-material/Description";
import TaskTypeIcon from "@/components/TaskTypeIcon";
import { getRoleLabel } from "@/lib/roleLabels";
import { formatDaysLeft, formatDueDate } from "@/lib/taskDate";
import type { AssignedTask } from "@/types/task";

interface TaskCardProps {
  task: AssignedTask;
  isCompleting: boolean;
  isCompleted?: boolean;
  completedAt?: string | null;
  onOpen: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

export default function TaskCard({
  task,
  isCompleting,
  isCompleted = false,
  completedAt = null,
  onOpen,
  onComplete,
}: TaskCardProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const requiresForm = task.hasFormFields && !isCompleted;

  const handleConfirm = () => {
    setIsConfirmOpen(false);
    onComplete(task.id);
  };

  const handleActionClick = () => {
    if (requiresForm) {
      onOpen(task.id);
      return;
    }

    setIsConfirmOpen(true);
  };

  return (
    <>
      <Card variant="outlined">
        <CardActionArea onClick={() => onOpen(task.id)}>
          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
                {task.title}
              </Typography>
              <TaskTypeIcon hasFormFields={task.hasFormFields} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              מאת {task.creatorRank} {task.creatorName} -{" "}
              {getRoleLabel(task.creatorRole)}
            </Typography>
            <Typography variant="body2">
              תג"ב: {formatDueDate(task.dueDate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDaysLeft(task.dueDate)}
            </Typography>
            {isCompleted && completedAt && (
              <Typography variant="body2" color="text.secondary">
                בוצע ב-{formatDueDate(completedAt)}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button
            variant="contained"
            size="small"
            fullWidth
            disabled={isCompleting || isCompleted}
            onClick={handleActionClick}
            startIcon={
              isCompleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : requiresForm ? (
                <DescriptionIcon />
              ) : (
                <CheckIcon />
              )
            }
          >
            {isCompleting
              ? "מסמן..."
              : isCompleted
                ? "סומן כבוצע"
                : requiresForm
                  ? "מלא טופס"
                  : "בוצע"}
          </Button>
        </CardActions>
      </Card>
      <Dialog
        open={isConfirmOpen && !requiresForm}
        onClose={() => setIsConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>סימון מטלה כבוצעה</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך לסמן את &quot;{task.title}&quot; כבוצעה?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsConfirmOpen(false)}>ביטול</Button>
          <Button variant="contained" onClick={handleConfirm}>
            אישור
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
