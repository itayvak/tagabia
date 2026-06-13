import { useState } from "react";
import {
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
import { getRoleLabel } from "@/lib/roleLabels";
import { formatDaysLeft, formatDueDate } from "@/lib/taskDate";
import type { PublicTask } from "@/types/task";

interface TaskCardProps {
  task: PublicTask;
  isCompleting: boolean;
  onOpen: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

export default function TaskCard({
  task,
  isCompleting,
  onOpen,
  onComplete,
}: TaskCardProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirm = () => {
    setIsConfirmOpen(false);
    onComplete(task.id);
  };

  return (
    <>
      <Card variant="outlined">
        <CardActionArea onClick={() => onOpen(task.id)}>
          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="h6" component="h2">
              {task.title}
            </Typography>
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
          </CardContent>
        </CardActionArea>
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button
            variant="contained"
            size="small"
            fullWidth
            disabled={isCompleting}
            onClick={() => setIsConfirmOpen(true)}
            startIcon={
              isCompleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckIcon />
              )
            }
          >
            {isCompleting ? "מסמן..." : "בוצע"}
          </Button>
        </CardActions>
      </Card>
      <Dialog
        open={isConfirmOpen}
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
