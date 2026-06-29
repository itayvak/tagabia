import {
  Box,
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
import ListAltIcon from "@mui/icons-material/ListAlt";
import TaskTypeIcon from "@/components/TaskTypeIcon";
import { formatDaysLeft, formatDueDate } from "@/lib/taskDate";
import type { PublicTask } from "@/types/task";

interface CreatedTaskCardProps {
  task: PublicTask;
  isDeleting?: boolean;
  onOpen: (taskId: string) => void;
  onEdit: () => void;
  onViewCompletions: () => void;
  onViewSubmissions?: () => void;
  onDelete: () => void;
}

export default function CreatedTaskCard({
  task,
  isDeleting = false,
  onOpen,
  onEdit,
  onViewCompletions,
  onViewSubmissions,
  onDelete,
}: CreatedTaskCardProps) {
  return (
    <Card variant="outlined">
      <CardActionArea onClick={() => onOpen(task.id)}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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
          תג"ב: {formatDueDate(task.dueDate)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatDaysLeft(task.dueDate)}
        </Typography>
      </CardContent>
      </CardActionArea>
      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, flexWrap: "wrap" }}>
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
        {task.hasFormFields && onViewSubmissions ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<ListAltIcon />}
            onClick={onViewSubmissions}
          >
            תשובות
          </Button>
        ) : null}
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
