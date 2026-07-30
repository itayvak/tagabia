import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { formatPlatoonLabel, getPlatoonForTeam, PLATOONS } from "@/lib/platoons";
import { formatDueDate, isCompletedLate } from "@/lib/taskDate";
import type { TaskAssigneeStatus } from "@/types/task";
import type { Platoon } from "@/types/user";

type CompletionFilter = "all" | "completed" | "pending";

interface TaskCompletionsDialogProps {
  open: boolean;
  taskTitle: string;
  dueDate: string;
  isLoading: boolean;
  assignees: TaskAssigneeStatus[];
  hasFormFields?: boolean;
  hasSubmissionDetails?: boolean;
  submittedUserIds?: string[];
  assignedTeams?: number[];
  groupByTeam?: boolean;
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

interface TeamGroup {
  team: number;
  assignees: TaskAssigneeStatus[];
}

function groupAssigneesByTeam(assignees: TaskAssigneeStatus[]): TeamGroup[] {
  const byTeam = new Map<number, TaskAssigneeStatus[]>();

  for (const assignee of assignees) {
    if (!byTeam.has(assignee.team)) {
      byTeam.set(assignee.team, []);
    }
    byTeam.get(assignee.team)!.push(assignee);
  }

  return [...byTeam.entries()]
    .sort(([teamA], [teamB]) => teamA - teamB)
    .map(([team, teamAssignees]) => ({ team, assignees: teamAssignees }));
}

export default function TaskCompletionsDialog({
  open,
  taskTitle,
  dueDate,
  isLoading,
  assignees,
  hasFormFields = false,
  hasSubmissionDetails = false,
  submittedUserIds = [],
  assignedTeams = [],
  groupByTeam = false,
  onClose,
  onViewSubmission,
  onViewAllSubmissions,
}: TaskCompletionsDialogProps) {
  const [filter, setFilter] = useState<CompletionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatoon, setSelectedPlatoon] = useState<Platoon | "">("");
  const [selectedTeam, setSelectedTeam] = useState<number | "">("");
  const [didCopy, setDidCopy] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());

  const effectiveAssignedTeams = useMemo(() => {
    if (assignedTeams.length > 0) {
      return [...assignedTeams].sort((a, b) => a - b);
    }

    const teams = new Set(assignees.map((assignee) => assignee.team));
    return [...teams].sort((a, b) => a - b);
  }, [assignedTeams, assignees]);

  const assignedPlatoons = useMemo(() => {
    const platoons = new Set<Platoon>();

    for (const team of effectiveAssignedTeams) {
      const platoon = getPlatoonForTeam(team);
      if (platoon) {
        platoons.add(platoon);
      }
    }

    return PLATOONS.filter((platoon) => platoons.has(platoon));
  }, [effectiveAssignedTeams]);

  const showPlatoonFilter = assignedPlatoons.length > 1;
  const showTeamFilter = effectiveAssignedTeams.length > 1;

  const submittedUserIdSet = useMemo(
    () => new Set(submittedUserIds),
    [submittedUserIds],
  );

  const completedCount = useMemo(
    () => assignees.filter((assignee) => assignee.completed).length,
    [assignees],
  );

  const submissionCount = hasSubmissionDetails
    ? submittedUserIds.length
    : completedCount;

  useEffect(() => {
    if (open) {
      setFilter("all");
      setSearchQuery("");
      setSelectedPlatoon("");
      setSelectedTeam("");
      setDidCopy(false);
      setExpandedTeams(new Set());
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
    if (query) {
      result = result.filter((assignee) =>
        assignee.assigneeName.toLowerCase().includes(query),
      );
    }

    if (selectedPlatoon !== "") {
      result = result.filter((assignee) => assignee.platoon === selectedPlatoon);
    }

    if (selectedTeam !== "") {
      result = result.filter((assignee) => assignee.team === selectedTeam);
    }

    return result;
  }, [assignees, filter, searchQuery, selectedPlatoon, selectedTeam]);

  const teamGroups = useMemo(
    () => (groupByTeam ? groupAssigneesByTeam(filteredAssignees) : []),
    [groupByTeam, filteredAssignees],
  );

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

  const toggleTeamExpanded = (team: number) => {
    setExpandedTeams((current) => {
      const next = new Set(current);
      if (next.has(team)) {
        next.delete(team);
      } else {
        next.add(team);
      }
      return next;
    });
  };

  const renderAssigneeItem = (assignee: TaskAssigneeStatus) => {
    const hasSubmission =
      hasSubmissionDetails &&
      assignee.completed &&
      submittedUserIdSet.has(assignee.userId);
    const canViewSubmission = hasSubmission && onViewSubmission !== undefined;
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
                  <Typography component="span" variant="caption" color="primary">
                    לחץ לצפייה בהגשה
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
          <ListItemButton onClick={() => onViewSubmission(assignee.userId)}>
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
            {hasSubmissionDetails
              ? `${submissionCount} מתוך ${assignees.length} הגישו`
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
        {!isLoading && assignees.length > 0 && (showPlatoonFilter || showTeamFilter) ? (
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            {showPlatoonFilter ? (
              <TextField
                select
                fullWidth
                size="small"
                label="פלוגה"
                value={selectedPlatoon}
                onChange={(event) =>
                  setSelectedPlatoon(event.target.value as Platoon | "")
                }
              >
                <MenuItem value="">הכל</MenuItem>
                {assignedPlatoons.map((platoon) => (
                  <MenuItem key={platoon} value={platoon}>
                    {formatPlatoonLabel(platoon)}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {showTeamFilter ? (
              <TextField
                select
                fullWidth
                size="small"
                label="צוות"
                value={selectedTeam}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedTeam(value === "" ? "" : Number(value));
                }}
              >
                <MenuItem value="">הכל</MenuItem>
                {effectiveAssignedTeams.map((team) => (
                  <MenuItem key={team} value={team}>
                    צוות {team}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
          </Box>
        ) : null}
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
            {searchQuery.trim() || selectedPlatoon !== "" || selectedTeam !== ""
              ? "לא נמצאו ממונים"
              : getEmptyFilterMessage(filter)}
          </Typography>
        ) : groupByTeam ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {teamGroups.map(({ team, assignees: teamAssignees }) => {
              const teamCompletedCount = teamAssignees.filter(
                (assignee) => assignee.completed,
              ).length;
              const platoon = getPlatoonForTeam(team);
              const isExpanded = expandedTeams.has(team);

              return (
                <Accordion
                  key={team}
                  disableGutters
                  variant="outlined"
                  expanded={isExpanded}
                  onChange={() => toggleTeamExpanded(team)}
                  sx={{ "&:before": { display: "none" }, borderRadius: 1, overflow: "hidden" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        pr: 1,
                      }}
                    >
                      <Typography variant="body2">
                        {platoon
                          ? `פלוגת ${formatPlatoonLabel(platoon)}, צוות ${team}`
                          : `צוות ${team}`}
                      </Typography>
                      <Chip
                        label={`${teamCompletedCount}/${teamAssignees.length} בוצעו`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <List disablePadding>
                      {teamAssignees.map((assignee) => renderAssigneeItem(assignee))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        ) : (
          <List disablePadding>
            {filteredAssignees.map((assignee) => renderAssigneeItem(assignee))}
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
          {hasSubmissionDetails &&
          onViewAllSubmissions &&
          submissionCount > 0 ? (
            <Button variant="outlined" onClick={onViewAllSubmissions}>
              {hasFormFields ? "צפה בכל ההגשות" : "צפה בכל הקבצים"}
            </Button>
          ) : null}
        </Box>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}
