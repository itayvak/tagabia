import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
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
import { getRoleLabel } from "@/lib/roles";
import { formatDaysLeft, formatDueDate, getDaysLeftChipUrgency } from "@/lib/taskDate";
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

  const actionLabel = isCompleting
    ? "מסמן..."
    : isCompleted
      ? "סומן כבוצע"
      : requiresForm
        ? "מלא טופס"
        : "בוצע";

  const daysLeftUrgency = getDaysLeftChipUrgency(task.dueDate);

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
        }}
      >
        <CardActionArea onClick={() => onOpen(task.id)} sx={{ flex: 1 }}>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.2,
            }}
          >
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
              <Chip
                label={formatDaysLeft(task.dueDate)}
                size="small"
                variant="outlined"
                sx={{
                  flexShrink: 0,
                  ...(daysLeftUrgency === "past" && {
                    bgcolor: "#fde8e8",
                    color: "#b42318",
                    borderColor: "#f5c2c2",
                  }),
                  ...(daysLeftUrgency === "soon" && {
                    bgcolor: "#fff0e0",
                    color: "#c2410c",
                    borderColor: "#fdba74",
                  }),
                  ...(daysLeftUrgency === "thisWeek" && {
                    bgcolor: "#fef9c3",
                    color: "#a16207",
                    borderColor: "#fde047",
                  }),
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              מאת {task.creatorRank} {task.creatorName} -{" "}
              {getRoleLabel(task.creatorRole)}
            </Typography>
            <Typography variant="body2">
              תג"ב: {formatDueDate(task.dueDate)}
            </Typography>
            {isCompleted && completedAt && (
              <Typography variant="body2" color="text.secondary">
                בוצע ב-{formatDueDate(completedAt)}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            p: 1.5,
            flexShrink: 0,
          }}
        >
          <Button
            variant="contained"
            disabled={isCompleting || isCompleted}
            onClick={handleActionClick}
            aria-label={actionLabel}
            sx={{
              alignSelf: "stretch",
              minWidth: 48,
              width: 48,
              p: 0,
            }}
          >
            {isCompleting ? (
              <CircularProgress size={20} color="inherit" />
            ) : requiresForm ? (
              <DescriptionIcon />
            ) : (
              <CheckIcon />
            )}
          </Button>
        </Box>
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
