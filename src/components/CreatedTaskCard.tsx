import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import ListAltIcon from "@mui/icons-material/ListAlt";
import TaskCategoryIcon from "@/components/TaskCategoryIcon";
import {
  formatDaysLeft,
  formatDueDate,
  getDaysLeftChipUrgency,
} from "@/lib/taskDate";
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
  const daysLeftUrgency = getDaysLeftChipUrgency(task.dueDate);

  return (
    <Card variant="outlined">
      <CardActionArea onClick={() => onOpen(task.id)}>
        <CardContent
          sx={{ display: "flex", flexDirection: "column", gap: 0.5, pb: 1.5 }}
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
            תג"ב: {formatDueDate(task.dueDate)}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TaskCategoryIcon category={task.category} />
            <Typography variant="caption" color="text.secondary">
              {task.category}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          px: 0.5,
          py: 0.25,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Tooltip title="סטטוס ביצוע">
          <IconButton
            size="small"
            aria-label="סטטוס ביצוע"
            onClick={onViewCompletions}
            color="primary"
          >
            <GroupIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {task.hasFormFields && onViewSubmissions ? (
          <Tooltip title="תשובות">
            <IconButton
              size="small"
              aria-label="תשובות"
              onClick={onViewSubmissions}
            >
              <ListAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
        <Tooltip title="עריכה">
          <IconButton size="small" aria-label="עריכה" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={isDeleting ? "מוחק..." : "מחיקה"}>
          <span>
            <IconButton
              size="small"
              aria-label="מחיקה"
              color="error"
              disabled={isDeleting}
              onClick={onDelete}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Card>
  );
}
