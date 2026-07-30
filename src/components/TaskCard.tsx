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
  IconButton,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DescriptionIcon from "@mui/icons-material/Description";
import UndoIcon from "@mui/icons-material/Undo";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import TaskCategoryIcon from "@/components/TaskCategoryIcon";
import { formatDaysLeft, formatDueDate, getDaysLeftChipUrgency } from "@/lib/taskDate";
import type { AssignedTask } from "@/types/task";

interface TaskCardProps {
  task: AssignedTask;
  isCompleting: boolean;
  isUncompleting?: boolean;
  isCompleted?: boolean;
  completedAt?: string | null;
  isPinned?: boolean;
  onTogglePin?: (taskId: string) => void;
  onOpen: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onUncomplete?: (taskId: string) => void;
}

export default function TaskCard({
  task,
  isCompleting,
  isUncompleting = false,
  isCompleted = false,
  completedAt = null,
  isPinned = false,
  onTogglePin,
  onOpen,
  onComplete,
  onUncomplete,
}: TaskCardProps) {
  const [confirmAction, setConfirmAction] = useState<"complete" | "uncomplete" | null>(
    null,
  );
  const requiresTaskDetails =
    (task.hasFormFields || task.allowCompletionFileUpload) && !isCompleted;
  const canUncomplete = isCompleted && Boolean(onUncomplete);
  const isActionPending = isCompleting || isUncompleting;

  const handleConfirm = () => {
    if (confirmAction === "uncomplete") {
      onUncomplete?.(task.id);
    } else {
      onComplete(task.id);
    }
    setConfirmAction(null);
  };

  const handleActionClick = () => {
    if (requiresTaskDetails) {
      onOpen(task.id);
      return;
    }

    setConfirmAction(canUncomplete ? "uncomplete" : "complete");
  };

  const actionLabel = isCompleting
    ? "מסמן..."
    : isUncompleting
      ? "מבטל..."
      : isCompleted
        ? canUncomplete
          ? "ביטול הגשה"
          : "סומן כבוצע"
        : requiresTaskDetails
          ? "פתח להגשה"
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
                alignItems: "center",
                justifyContent: "space-between",
                gap: 0.5,
              }}
            >
              <Typography variant="h6" component="h2" sx={{ flex: 1, m: 0 }}>
                {task.title}
              </Typography>
              {onTogglePin ? (
                <IconButton
                  size="small"
                  aria-label={isPinned ? "בטל הצמדה" : "הצמד למעלה"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onTogglePin(task.id);
                  }}
                  sx={{
                    flexShrink: 0,
                    color: isPinned ? "primary.main" : "action.active",
                  }}
                >
                  {isPinned ? (
                    <PushPinIcon fontSize="small" />
                  ) : (
                    <PushPinOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              ) : null}
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
            <Typography variant="body2">
              תג&quot;ב: {formatDueDate(task.dueDate)}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <TaskCategoryIcon category={task.category} />
              <Typography variant="caption" color="text.secondary">
                {task.category}
              </Typography>
            </Box>
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
            pl: 0,
            flexShrink: 0,
          }}
        >
          <Button
            variant="contained"
            color={canUncomplete ? "inherit" : "primary"}
            disabled={isActionPending || (isCompleted && !canUncomplete)}
            onClick={(event) => {
              event.stopPropagation();
              handleActionClick();
            }}
            aria-label={actionLabel}
            sx={{
              alignSelf: "stretch",
              minWidth: 48,
              width: 48,
              p: 0,
              ...(canUncomplete && {
                bgcolor: "grey.300",
                color: "text.primary",
                "&:hover": { bgcolor: "grey.400" },
              }),
            }}
          >
            {isActionPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : requiresTaskDetails ? (
              <DescriptionIcon />
            ) : canUncomplete ? (
              <UndoIcon />
            ) : (
              <CheckIcon />
            )}
          </Button>
        </Box>
      </Card>
      <Dialog
        open={confirmAction !== null && !requiresTaskDetails}
        onClose={() => setConfirmAction(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {confirmAction === "uncomplete" ? "ביטול הגשה" : "סימון מטלה כבוצעה"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === "uncomplete"
              ? `האם אתה בטוח שאתה רוצה לבטל את ההגשה של המטלה "${task.title}"?`
              : `האם אתה בטוח שברצונך לסמן את "${task.title}" כבוצעה?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmAction(null)}>ביטול</Button>
          <Button variant="contained" onClick={handleConfirm}>
            אישור
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
