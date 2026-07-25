import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { formatPlatoonLabel } from "@/lib/platoons";
import { formatDueDate, isCompletedLate } from "@/lib/taskDate";
import type { TaskAssigneeStatus } from "@/types/task";

type CompletionFilter = "all" | "completed" | "pending";

interface TaskCompletionsDialogProps {
  open: boolean;
  taskTitle: string;
  dueDate: string;
  isLoading: boolean;
  assignees: TaskAssigneeStatus[];
  hasFormFields?: boolean;
  submittedUserIds?: string[];
  onClose: () => void;
  onViewSubmission?: (userId: string) => void;
  onViewAllSubmissions?: () => void;
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
        return `${name} - ${assignee.completed ? "בוצע ✅" : "טרם בוצע ❌"}`;
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
  dueDate,
  isLoading,
  assignees,
  hasFormFields = false,
  submittedUserIds = [],
  onClose,
  onViewSubmission,
  onViewAllSubmissions,
}: TaskCompletionsDialogProps) {
  const [filter, setFilter] = useState<CompletionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [didCopy, setDidCopy] = useState(false);

  const submittedUserIdSet = useMemo(
    () => new Set(submittedUserIds),
    [submittedUserIds],
  );

  const completedCount = useMemo(
    () => assignees.filter((assignee) => assignee.completed).length,
    [assignees],
  );

  const submissionCount = hasFormFields
    ? submittedUserIds.length
    : completedCount;

  useEffect(() => {
    if (open) {
      setFilter("all");
      setSearchQuery("");
      setDidCopy(false);
    }
  }, [open]);

  const filteredAssignees = useMemo(() => {
    let result;
    switch (filter) {
      case "completed":
        result = assignees.filter((assignee) => assignee.completed);
        break;
      case "pending":
        result = assignees.filter((assignee) => !assignee.completed);
        break;
      default:
        result = assignees;
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return result;

    return result.filter((assignee) =>
      assignee.assigneeName.toLowerCase().includes(query),
    );
  }, [assignees, filter, searchQuery]);

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
          <Typography variant="body2" sx={{ mb: 2 }}>
            {hasFormFields
              ? `${submissionCount} מתוך ${assignees.length} הגישו טופס`
              : `${completedCount} מתוך ${assignees.length} ביצעו את המטלה`}
          </Typography>
        )}
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
        {!isLoading && assignees.length > 0 && (
          <TextField
            fullWidth
            size="small"
            placeholder="חיפוש לפי שם..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
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
            {filteredAssignees.map((assignee) => {
              const hasSubmission =
                hasFormFields &&
                assignee.completed &&
                submittedUserIdSet.has(assignee.userId);
              const canViewSubmission =
                hasSubmission && onViewSubmission !== undefined;
              const completedLate =
                dueDate !== "" &&
                assignee.completed &&
                assignee.completedAt !== null &&
                isCompletedLate(dueDate, assignee.completedAt);

              const listContent = (
                <>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {assignee.completed ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography component="span">
                          {`${assignee.assigneeName}`.trim()}
                        </Typography>
                        {completedLate ? (
                          <Chip
                            label="באיחור"
                            size="small"
                            variant="outlined"
                            sx={{
                              bgcolor: "#fde8e8",
                              color: "#b42318",
                              borderColor: "#f5c2c2",
                              height: 22,
                            }}
                          />
                        ) : null}
                      </Box>
                    }
                    secondary={
                      <>
                        {`פלוגת ${formatPlatoonLabel(assignee.platoon)}, צוות ${assignee.team}`}
                        <br />
                        {formatAssigneeStatus(assignee)}
                        {canViewSubmission ? (
                          <>
                            <br />
                            <Typography
                              component="span"
                              variant="caption"
                              color="primary"
                            >
                              לחץ לצפייה בתשובה
                            </Typography>
                          </>
                        ) : null}
                      </>
                    }
                  />
                </>
              );

              if (canViewSubmission) {
                return (
                  <ListItem key={assignee.userId} disablePadding divider>
                    <ListItemButton
                      onClick={() => onViewSubmission(assignee.userId)}
                    >
                      {listContent}
                    </ListItemButton>
                  </ListItem>
                );
              }

              return (
                <ListItem key={assignee.userId} disableGutters divider>
                  {listContent}
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            disabled={isLoading || filteredAssignees.length === 0}
            onClick={() => void handleCopyList()}
          >
            {didCopy ? "הועתק!" : "העתק רשימה"}
          </Button>
          {hasFormFields &&
          onViewAllSubmissions &&
          submissionCount > 0 ? (
            <Button variant="outlined" onClick={onViewAllSubmissions}>
              צפה בכל התשובות
            </Button>
          ) : null}
        </Box>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}
