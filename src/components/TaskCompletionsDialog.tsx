import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { formatPlatoonLabel } from "@/lib/platoons";
import { formatDueDate } from "@/lib/taskDate";
import type { TaskAssigneeStatus } from "@/types/task";

type CompletionFilter = "all" | "completed" | "pending";

interface TaskCompletionsDialogProps {
  open: boolean;
  taskTitle: string;
  isLoading: boolean;
  assignees: TaskAssigneeStatus[];
  onClose: () => void;
}

function formatAssigneeStatus(assignee: TaskAssigneeStatus): string {
  return assignee.completed && assignee.completedAt
    ? `בוצע ב-${formatDueDate(assignee.completedAt)}`
    : "טרם בוצע";
}

function formatAssigneeListText(
  assignees: TaskAssigneeStatus[],
  filter: CompletionFilter,
): string {
  return assignees
    .map((assignee) => {
      const name = assignee.assigneeName.trim();

      if (filter === "all") {
        return `${name} - ${assignee.completed ? "בוצע" : "טרם בוצע"}`;
      }

      return name;
    })
    .join("\n");
}

function getEmptyFilterMessage(filter: CompletionFilter): string {
  switch (filter) {
    case "completed":
      return "אף אחד עדיין לא סימן את המטלה כבוצעה";
    case "pending":
      return "כל הממונים ביצעו את המטלה";
    default:
      return "אין ממונים למטלה זו";
  }
}

export default function TaskCompletionsDialog({
  open,
  taskTitle,
  isLoading,
  assignees,
  onClose,
}: TaskCompletionsDialogProps) {
  const [filter, setFilter] = useState<CompletionFilter>("all");
  const [didCopy, setDidCopy] = useState(false);

  useEffect(() => {
    if (open) {
      setFilter("all");
      setDidCopy(false);
    }
  }, [open]);

  const filteredAssignees = useMemo(() => {
    switch (filter) {
      case "completed":
        return assignees.filter((assignee) => assignee.completed);
      case "pending":
        return assignees.filter((assignee) => !assignee.completed);
      default:
        return assignees;
    }
  }, [assignees, filter]);

  const handleCopyList = async () => {
    if (filteredAssignees.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        formatAssigneeListText(filteredAssignees, filter),
      );
      setDidCopy(true);
      window.setTimeout(() => setDidCopy(false), 2000);
    } catch {
      setDidCopy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>סטטוס ביצוע המטלה</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {taskTitle}
        </Typography>
        {!isLoading && assignees.length > 0 && (
          <ToggleButtonGroup
            value={filter}
            exclusive
            fullWidth
            size="small"
            onChange={(_, value: CompletionFilter | null) => {
              if (value) {
                setFilter(value);
              }
            }}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="all">הכל</ToggleButton>
            <ToggleButton value="completed">ביצעו</ToggleButton>
            <ToggleButton value="pending">טרם ביצעו</ToggleButton>
          </ToggleButtonGroup>
        )}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : assignees.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
            אין ממונים למטלה זו
          </Typography>
        ) : filteredAssignees.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
            {getEmptyFilterMessage(filter)}
          </Typography>
        ) : (
          <List disablePadding>
            {filteredAssignees.map((assignee) => (
              <ListItem key={assignee.userId} disableGutters divider>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {assignee.completed ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={`${assignee.assigneeName}`.trim()}
                  secondary={
                    <>
                      {`פלוגת ${formatPlatoonLabel(assignee.platoon)}, צוות ${assignee.team}`}
                      <br />
                      {formatAssigneeStatus(assignee)}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
        <Button
          variant="outlined"
          startIcon={<ContentCopyIcon />}
          disabled={isLoading || filteredAssignees.length === 0}
          onClick={() => void handleCopyList()}
        >
          {didCopy ? "הועתק!" : "העתק רשימה"}
        </Button>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}
