import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import { formatDaysLeft, formatDueDate } from "@/lib/taskDate";
import type { PublicTask } from "@/types/task";

interface CreatedTaskCardProps {
  task: PublicTask;
  isDeleting?: boolean;
  onOpen: (taskId: string) => void;
  onEdit: () => void;
  onViewCompletions: () => void;
  onDelete: () => void;
}

export default function CreatedTaskCard({
  task,
  isDeleting = false,
  onOpen,
  onEdit,
  onViewCompletions,
  onDelete,
}: CreatedTaskCardProps) {
  return (
    <Card variant="outlined">
      <CardActionArea onClick={() => onOpen(task.id)}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="h6" component="h2">
          {task.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          תג"ב: {formatDueDate(task.dueDate)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatDaysLeft(task.dueDate)}
        </Typography>
      </CardContent>
      </CardActionArea>
      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={onEdit}
        >
          עריכה
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<GroupIcon />}
          onClick={onViewCompletions}
        >
          סטטוס ביצוע
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          disabled={isDeleting}
          onClick={onDelete}
        >
          {isDeleting ? "מוחק..." : "מחיקה"}
        </Button>
      </CardActions>
    </Card>
  );
}
