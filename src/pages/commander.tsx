import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DownloadIcon from "@mui/icons-material/Download";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import ShareIcon from "@mui/icons-material/Share";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import TimerOffIcon from "@mui/icons-material/TimerOff";
import AppLayout from "@/components/AppLayout";
import ProfileDrawer from "@/components/ProfileDrawer";
import { getSession } from "@/lib/authStorage";
import { filterCommanderDashboardByTask } from "@/lib/commanderDashboard";
import { downloadCommanderDashboardCsv } from "@/lib/commanderDashboardCsv";
import { fetchCommanderDashboard } from "@/lib/fetchCommanderDashboard";
import { formatDueDate } from "@/lib/taskDate";
import { renderCommanderDashboardImage } from "@/lib/renderCommanderDashboardImage";
import { shareImageFile } from "@/lib/shareImageFile";
import type {
  CommanderAssignmentStatus,
  CommanderDashboardData,
  CommanderDashboardErrorResponse,
  CommanderDashboardMember,
  CommanderDashboardTask,
} from "@/types/commanderDashboard";
import type { PublicUser } from "@/types/user";

type MetricDetail =
  | "tasks"
  | "members"
  | "completion"
  | "onTime"
  | "notOnTime"
  | "overdue";

const DASHBOARD_CACHE_PREFIX = "commander_dashboard:v3:";

function readCachedDashboard(userId: string): CommanderDashboardData | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(`${DASHBOARD_CACHE_PREFIX}${userId}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CommanderDashboardData;
    return parsed?.scope &&
      parsed?.summary &&
      parsed?.range &&
      Array.isArray(parsed.tasks) &&
      Array.isArray(parsed.overdueRows)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function cacheDashboard(userId: string, dashboard: CommanderDashboardData) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(
      `${DASHBOARD_CACHE_PREFIX}${userId}`,
      JSON.stringify(dashboard),
    );
  } catch {
    // The dashboard still works when browser storage is unavailable.
  }
}

const STATUS_LABELS: Record<CommanderAssignmentStatus, string> = {
  onTime: "הוגש בזמן",
  late: "הוגש באיחור",
  pending: "טרם הוגש",
  overdue: "טרם הוגש — המועד עבר",
};

const STATUS_COLORS: Record<
  CommanderAssignmentStatus,
  "success" | "warning" | "default" | "error"
> = {
  onTime: "success",
  late: "warning",
  pending: "default",
  overdue: "error",
};

function MetricCard({
  label,
  value,
  icon,
  color = "primary.main",
  description,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea
        onClick={onClick}
        sx={{ height: "100%", alignItems: "stretch" }}
      >
        <CardContent sx={{ height: "100%" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color }}>
                {value}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {description}
              </Typography>
            </Box>
            <Box sx={{ color, display: "flex" }}>{icon}</Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box component="section">
      <Typography
        variant="h6"
        component="h2"
        sx={{ mb: 1.5, fontWeight: 700 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function MetricDetailsDialog({
  detail,
  dashboard,
  onClose,
  onOpenMember,
  onOpenTask,
}: {
  detail: MetricDetail | null;
  dashboard: CommanderDashboardData | null;
  onClose: () => void;
  onOpenMember: (member: CommanderDashboardMember) => void;
  onOpenTask: (task: CommanderDashboardTask) => void;
}) {
  if (!dashboard) {
    return null;
  }

  const assignmentRows =
    detail === "onTime"
        ? dashboard.csvRows.filter((row) => row.status === "onTime")
        : detail === "notOnTime"
          ? dashboard.csvRows.filter(
              (row) => row.status === "late" || row.status === "overdue",
            )
          : detail === "overdue"
            ? dashboard.overdueRows
            : [];

  const title =
    detail === "tasks"
      ? `מטלות בתקופה (${dashboard.tasks.length})`
      : detail === "members"
        ? `חניכי הצוות (${dashboard.members.length})`
        : detail === "completion"
          ? "פירוט שיעור ההשלמה"
          : detail === "onTime"
            ? "מטלות שהושלמו בזמן"
            : detail === "notOnTime"
              ? "מטלות שלא הושלמו בזמן"
              : "חניכים עם מטלה שמועד הגשתה עבר";

  const explanation =
    detail === "tasks"
      ? "מוצגות מטלות שמועד ההגשה שלהן חל בתקופה שנבחרה."
      : detail === "members"
        ? "מוצגים כל החניכים הפעילים בצוות של המפקד."
        : detail === "completion"
          ? `${dashboard.summary.fullyCompletedMemberCount} מתוך ${dashboard.summary.assignedMemberCount} הצוערים שקיבלו לפחות מטלה אחת שמועדה חל בתקופה שנבחרה השלימו את כל המטלות שלהם בתקופה.`
          : detail === "onTime"
            ? `${dashboard.summary.onTimeCount} מתוך ${dashboard.summary.dueAssignmentCount} המטלות בתקופה שמועד הגשתן כבר עבר הושלמו בזמן.`
            : detail === "notOnTime"
              ? `${dashboard.summary.notOnTimeCount} מתוך ${dashboard.summary.dueAssignmentCount} המטלות בתקופה שמועד הגשתן כבר עבר לא הושלמו בזמן. המדד כולל גם הגשות מאוחרות וגם מטלות שטרם הוגשו.`
              : "מוצגות כל המטלות שטרם הוגשו ומועד הגשתן עבר, גם אם מועד ההגשה נמצא מחוץ לתקופה שנבחרה.";

  return (
    <Dialog
      open={detail !== null}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          {explanation}
        </Alert>

        {detail === "members" || detail === "completion" ? (
          <List disablePadding>
            {dashboard.members
              .filter(
                (member) =>
                  detail === "members" || member.assignmentCount > 0,
              )
              .map((member) => (
              <ListItemButton
                key={member.userId}
                onClick={() => onOpenMember(member)}
                divider
              >
                <ListItemText
                  primary={`${member.rank} ${member.fullname}`}
                  secondary={
                    detail === "completion"
                      ? member.completedAllTasks
                        ? `השלים/ה את כל ${member.assignmentCount} המטלות בתקופה`
                        : `השלים/ה ${member.completedCount} מתוך ${member.assignmentCount} מטלות בתקופה`
                      : `${member.completedCount} מתוך ${member.assignmentCount} מטלות בתקופה הוגשו`
                  }
                />
                {detail === "completion" ? (
                  <Chip
                    size="small"
                    color={member.completedAllTasks ? "success" : "warning"}
                    label={
                      member.completedAllTasks
                        ? "כל המטלות הושלמו"
                        : "נותרו מטלות"
                    }
                  />
                ) : null}
              </ListItemButton>
              ))}
          </List>
        ) : detail === "tasks" && dashboard.tasks.length > 0 ? (
          <List disablePadding>
            {dashboard.tasks.map((task) => (
              <ListItemButton
                key={task.taskId}
                onClick={() => onOpenTask(task)}
                divider
              >
                <ListItemText
                  primary={task.title}
                  secondary={`${task.category} · מועד הגשה: ${formatDueDate(task.dueDate)} · ${task.completedCount} מתוך ${task.totalAssignments} חניכים הגישו`}
                />
              </ListItemButton>
            ))}
          </List>
        ) : detail === "tasks" ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            אין מטלות שמועד הגשתן חל בתקופה שנבחרה.
          </Typography>
        ) : assignmentRows.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            אין רשומות להצגה.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>חניך</TableCell>
                  <TableCell>מטלה</TableCell>
                  <TableCell>מועד הגשה</TableCell>
                  <TableCell>מועד ביצוע</TableCell>
                  <TableCell>מצב</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignmentRows.map((row) => (
                  <TableRow key={`${row.userId}:${row.taskId}`} hover>
                    <TableCell>
                      {row.rank} {row.fullname}
                    </TableCell>
                    <TableCell>{row.taskTitle}</TableCell>
                    <TableCell>{formatDueDate(row.dueDate)}</TableCell>
                    <TableCell>
                      {row.completedAt
                        ? formatDueDate(row.completedAt)
                        : "טרם הוגש"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={STATUS_LABELS[row.status]}
                        color={STATUS_COLORS[row.status]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}

function MemberDialog({
  member,
  onClose,
}: {
  member: CommanderDashboardMember | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={member !== null} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {member ? `${member.rank} ${member.fullname}` : ""}
      </DialogTitle>
      <DialogContent dividers>
        {member ? (
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
              }}
            >
              <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                <Typography variant="h6">{member.completionRate}%</Typography>
                <Tooltip
                  title="מספר המטלות שהחניך הגיש מתוך המטלות ששויכו אליו ושמועד הגשתן חל בתקופה שנבחרה"
                  arrow
                >
                  <Typography
                    variant="caption"
                    sx={{ textDecoration: "underline dotted" }}
                  >
                    שיעור הגשת מטלות
                  </Typography>
                </Tooltip>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                <Typography variant="h6">{member.onTimeCount}</Typography>
                <Typography variant="caption">הוגשו בזמן</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                <Typography variant="h6" color="error.main">
                  {member.overdueBacklogCount}
                </Typography>
                <Typography variant="caption">טרם הוגשו והמועד עבר</Typography>
              </Paper>
            </Box>
            {member.tasks.length === 0 ? (
              <Typography color="text.secondary" align="center">
                אין מטלות בטווח שנבחר
              </Typography>
            ) : (
              <List disablePadding>
                {member.tasks.map((task) => (
                  <Box key={task.taskId}>
                    <Box sx={{ py: 1.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ fontWeight: 600 }}>
                          {task.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={STATUS_LABELS[task.status]}
                          color={STATUS_COLORS[task.status]}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {task.category} · מועד הגשה:{" "}
                        {formatDueDate(task.dueDate)}
                      </Typography>
                    </Box>
                    <Divider />
                  </Box>
                ))}
              </List>
            )}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}

function TaskDialog({
  task,
  onClose,
}: {
  task: CommanderDashboardTask | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={task !== null} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{task?.title ?? ""}</DialogTitle>
      <DialogContent dividers>
        {task ? (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {task.category} · מועד הגשה: {formatDueDate(task.dueDate)} · נוצרה
              על ידי {task.creatorRank} {task.creatorName}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={task.completionRate}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography align="center">
              {task.completedCount} מתוך {task.totalAssignments} חניכים הגישו (
              {task.completionRate}%)
            </Typography>
            <List disablePadding>
              {task.people.map((person) => (
                <Box key={person.userId}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      py: 1.25,
                    }}
                  >
                    <Typography>
                      {person.rank} {person.fullname}
                    </Typography>
                    <Chip
                      size="small"
                      label={STATUS_LABELS[person.status]}
                      color={STATUS_COLORS[person.status]}
                    />
                  </Box>
                  <Divider />
                </Box>
              ))}
            </List>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function CommanderPage() {
  const [user] = useState<PublicUser | null>(
    () => getSession()?.user ?? null,
  );
  const [baseDashboard, setBaseDashboard] =
    useState<CommanderDashboardData | null>(
    () => (user ? readCachedDashboard(user.id) : null),
    );
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [isLoading, setIsLoading] = useState(baseDashboard === null);
  const [isSharing, setIsSharing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<CommanderDashboardMember | null>(null);
  const [selectedTask, setSelectedTask] =
    useState<CommanderDashboardTask | null>(null);
  const [metricDetail, setMetricDetail] = useState<MetricDetail | null>(null);
  const [fromDate, setFromDate] = useState(baseDashboard?.range.from ?? "");
  const [toDate, setToDate] = useState(baseDashboard?.range.to ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const initialLoadStartedRef = useRef(baseDashboard !== null);
  const requestIdRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);

  const loadDashboard = useCallback(
    async (range?: { from: string; to: string }) => {
      if (!user) {
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      requestControllerRef.current?.abort();
      const controller = new AbortController();
      const requestId = ++requestIdRef.current;
      requestControllerRef.current = controller;

      try {
        const { response, data } = await fetchCommanderDashboard(
          user.id,
          range,
          controller.signal,
        );
        if (requestId !== requestIdRef.current) {
          return;
        }
        if (!response.ok || !("dashboard" in data)) {
          const error = (data as CommanderDashboardErrorResponse).error;
          setErrorMessage(error || "טעינת לוח המפקד נכשלה");
          return;
        }

        setBaseDashboard(data.dashboard);
        setSelectedTaskId("");
        cacheDashboard(user.id, data.dashboard);
        setFromDate(data.dashboard.range.from);
        setToDate(data.dashboard.range.to);
      } catch (error) {
        if (
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
        setErrorMessage("שגיאה בטעינת לוח המפקד. נסה שוב.");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [user],
  );

  useEffect(() => {
    if (baseDashboard || initialLoadStartedRef.current) {
      return;
    }

    initialLoadStartedRef.current = true;
    queueMicrotask(() => {
      void loadDashboard();
    });
  }, [baseDashboard, loadDashboard]);

  const dashboard = useMemo(
    () =>
      baseDashboard && selectedTaskId
        ? filterCommanderDashboardByTask(baseDashboard, selectedTaskId)
        : baseDashboard,
    [baseDashboard, selectedTaskId],
  );

  const handleApplyRange = () => {
    if (!fromDate || !toDate || fromDate > toDate) {
      setErrorMessage("יש לבחור טווח תאריכים תקין");
      return;
    }
    void loadDashboard({ from: fromDate, to: toDate });
  };

  const handleShare = async () => {
    if (!dashboard) {
      return;
    }

    setIsSharing(true);
    setErrorMessage(null);
    try {
      const blob = await renderCommanderDashboardImage(dashboard);
      const result = await shareImageFile(
        blob,
        `commander-team-${dashboard.scope.team}.png`,
        "דוח צוות",
        `${window.location.origin}/commander`,
      );
      setSuccessMessage(
        result === "shared" ? "הדוח שותף בהצלחה" : "התמונה הורדה למכשיר",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setErrorMessage("יצירת תמונת הדוח נכשלה");
    } finally {
      setIsSharing(false);
    }
  };

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>לוח מפקד · All In One</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout user={user}>
        <Box
          component="header"
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            py: 2,
            px: 2,
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                לוח מפקד
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {dashboard?.scope.teamName ?? `צוות ${user.team}`}
              </Typography>
            </Box>
            <IconButton
              color="inherit"
              aria-label="פרופיל"
              onClick={() => setProfileOpen(true)}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: "white", color: "primary.main" }}>
                <PersonIcon />
              </Avatar>
            </IconButton>
          </Container>
        </Box>

        <Container
          maxWidth="lg"
          sx={{ py: 3, display: "flex", flexDirection: "column", gap: 3 }}
        >
          {isLoading && dashboard ? (
            <LinearProgress
              aria-label="מרענן את נתוני לוח המפקד"
              sx={{ mt: -3, mx: { xs: -2, sm: 0 } }}
            />
          ) : null}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: 1.5,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography variant="overline" color="text.secondary">
                תקופת הדוח
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>
                {dashboard?.range.label ?? "טוען..."}
              </Typography>
            </Box>
            <TextField
              label="מתאריך"
              type="date"
              size="small"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="עד תאריך"
              type="date"
              size="small"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 260 } }}>
              <InputLabel id="commander-task-filter-label">מטלה</InputLabel>
              <Select
                labelId="commander-task-filter-label"
                label="מטלה"
                value={selectedTaskId}
                onChange={(event) => setSelectedTaskId(event.target.value)}
              >
                <MenuItem value="">כל המטלות בתקופה</MenuItem>
                {(baseDashboard?.tasks ?? []).map((task) => (
                  <MenuItem key={task.taskId} value={task.taskId}>
                    {task.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<CalendarMonthIcon />}
              onClick={handleApplyRange}
              disabled={isLoading}
            >
              הצג
            </Button>
            <Button
              variant="text"
              startIcon={<RefreshIcon />}
              onClick={() => void loadDashboard()}
              disabled={isLoading}
            >
              חזור לשבוע הנוכחי
            </Button>
          </Paper>

          {isLoading && !dashboard ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : !dashboard ? (
            <Alert severity="error">לא ניתן לטעון את לוח המפקד</Alert>
          ) : (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                    lg: "repeat(6, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                <MetricCard
                  label="מטלות בטווח"
                  value={dashboard.summary.taskCount}
                  icon={<AssessmentIcon fontSize="large" />}
                  description="מטלות שמועד הגשתן חל בתקופה שנבחרה"
                  onClick={() => setMetricDetail("tasks")}
                />
                <MetricCard
                  label={
                    selectedTaskId ? "צוערים משויכים" : "חניכים בצוות"
                  }
                  value={dashboard.summary.memberCount}
                  icon={<GroupIcon fontSize="large" />}
                  description={
                    selectedTaskId
                      ? "כל הצוערים המשויכים למטלה שנבחרה"
                      : "כל החניכים הפעילים בצוות"
                  }
                  onClick={() => setMetricDetail("members")}
                />
                <MetricCard
                  label="שיעור השלמה"
                  value={`${dashboard.summary.completionRate}%`}
                  icon={<TaskAltIcon fontSize="large" />}
                  color="success.main"
                  description="צוערים שהשלימו את כל מטלות התקופה"
                  onClick={() => setMetricDetail("completion")}
                />
                <MetricCard
                  label="הושלמו בזמן"
                  value={`${dashboard.summary.onTimeRate}%`}
                  icon={<TaskAltIcon fontSize="large" />}
                  description="מתוך המטלות בתקופה שמועדן כבר עבר"
                  onClick={() => setMetricDetail("onTime")}
                />
                <MetricCard
                  label="לא הושלמו בזמן"
                  value={`${dashboard.summary.notOnTimeRate}%`}
                  icon={<TimerOffIcon fontSize="large" />}
                  color={
                    dashboard.summary.notOnTimeCount > 0
                      ? "warning.main"
                      : "success.main"
                  }
                  description="הוגשו באיחור או טרם הוגשו לאחר המועד"
                  onClick={() => setMetricDetail("notOnTime")}
                />
                <MetricCard
                  label="חניכים עם מטלה באיחור"
                  value={dashboard.summary.overdueMemberCount}
                  icon={<TimerOffIcon fontSize="large" />}
                  color={
                    dashboard.summary.overdueMemberCount > 0
                      ? "error.main"
                      : "success.main"
                  }
                  description="לפחות מטלה אחת טרם הוגשה ומועדה עבר"
                  onClick={() => setMetricDetail("overdue")}
                />
              </Box>

              <Alert severity="info" variant="outlined">
                <strong>שיעור השלמה:</strong>{" "}
                {dashboard.summary.fullyCompletedMemberCount} מתוך{" "}
                {dashboard.summary.assignedMemberCount} הצוערים שקיבלו לפחות
                מטלה אחת שמועד הגשתה חל בתקופה שנבחרה השלימו את כל המטלות שלהם
                בתקופה. צוער ללא מטלות בתקופה אינו נכלל בחישוב.
              </Alert>

              {selectedTaskId && dashboard.tasks[0] ? (
                <Alert severity="success" variant="outlined">
                  הדוח מסונן לפי המטלה <strong>{dashboard.tasks[0].title}</strong>.
                  כל המדדים, הרשימות, הטבלה והייצוא מתייחסים רק למטלה זו.
                </Alert>
              ) : null}

              <Section title="תובנות מרכזיות">
                <Stack spacing={1}>
                  {dashboard.repeatedLateMembers.map((member) => (
                    <Alert
                      key={member.userId}
                      severity="warning"
                      variant="outlined"
                    >
                      אצל {member.rank} {member.fullname} נרשמו{" "}
                      {member.lateSubmissionCount === 2
                        ? "שתי"
                        : member.lateSubmissionCount}{" "}
                      הגשות באיחור בשבועיים האחרונים.
                    </Alert>
                  ))}
                  {dashboard.insights.map((insight) => (
                    <Alert key={insight} severity="info" variant="outlined">
                      {insight}
                    </Alert>
                  ))}
                  {dashboard.insights.length === 0 &&
                  dashboard.repeatedLateMembers.length === 0 ? (
                    <Typography color="text.secondary">
                      אין תובנות להצגה בתקופה שנבחרה.
                    </Typography>
                  ) : null}
                </Stack>
              </Section>

              <Section title="השלמת כל המטלות לפי קטגוריה">
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    {dashboard.categories.map((category) => (
                      <Box key={category.category}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2">
                            {category.category}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                          >
                            {category.memberCount} חניכים ·{" "}
                            {category.completedMemberCount} השלימו את כל
                            המטלות בקטגוריה (
                            {category.completionRate}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={category.completionRate}
                          sx={{ height: 9, borderRadius: 5 }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Section>

              <Section title="מטלות שדורשות תשומת לב">
                {dashboard.bottlenecks.length === 0 ? (
                  <Alert severity="success" variant="outlined">
                    אין מטלות פתוחות בטווח שנבחר.
                  </Alert>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: 1.5,
                    }}
                  >
                    {dashboard.bottlenecks.map((task) => (
                      <Card key={task.taskId} variant="outlined">
                        <CardActionArea onClick={() => setSelectedTask(task)}>
                          <CardContent>
                            <Typography variant="h6" sx={{ fontSize: "1rem" }}>
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.category} · {formatDueDate(task.dueDate)}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={task.completionRate}
                              sx={{ height: 8, borderRadius: 4, my: 1.5 }}
                            />
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2">
                                {task.completedCount} מתוך{" "}
                                {task.totalAssignments} חניכים הגישו
                              </Typography>
                              <Typography
                                variant="body2"
                                color={
                                  task.overdueCount > 0
                                    ? "error.main"
                                    : "text.secondary"
                                }
                              >
                                {task.overdueCount} טרם הגישו והמועד עבר
                              </Typography>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Box>
                )}
              </Section>

              <Section
                title={
                  selectedTaskId
                    ? "צוערים המשויכים למטלה"
                    : "חברי הצוות"
                }
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
                >
                  “השלמת כל המטלות” מציינת אם הצוער הגיש את כל המטלות ששויכו
                  אליו ושמועד הגשתן חל בתקופה שנבחרה. לצד זאת מוצג מספר המטלות
                  שהוגשו בפועל. לחיצה על שורה תציג את פירוט המטלות.
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>חניך</TableCell>
                        <TableCell align="center">מטלות בתקופה</TableCell>
                        <TableCell align="center">הוגשו</TableCell>
                        <TableCell align="center">
                          <Tooltip
                            title="האם הצוער הגיש את כל המטלות ששויכו אליו ושמועד הגשתן חל בתקופה"
                            arrow
                          >
                            <Box
                              component="span"
                              sx={{ textDecoration: "underline dotted" }}
                            >
                              השלמת כל המטלות
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">הוגשו באיחור</TableCell>
                        <TableCell align="center">
                          טרם הוגשו והמועד עבר
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboard.members.map((member) => (
                        <TableRow
                          key={member.userId}
                          hover
                          onClick={() => setSelectedMember(member)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>
                            {member.rank} {member.fullname}
                          </TableCell>
                          <TableCell align="center">
                            {member.assignmentCount}
                          </TableCell>
                          <TableCell align="center">
                            {member.completedCount}
                          </TableCell>
                          <TableCell align="center">
                            {member.assignmentCount === 0
                              ? "אין מטלות"
                              : member.completedAllTasks
                                ? "כן"
                                : "לא"}
                          </TableCell>
                          <TableCell align="center">
                            {member.lateCount}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color:
                                member.overdueBacklogCount > 0
                                  ? "error.main"
                                  : "text.primary",
                              fontWeight:
                                member.overdueBacklogCount > 0 ? 700 : 400,
                            }}
                          >
                            {member.overdueBacklogCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Section>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  הנתונים נשמרים על המסך ואינם מתרעננים אוטומטית. עודכן לאחרונה:{" "}
                  {new Intl.DateTimeFormat("he-IL", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "Asia/Jerusalem",
                  }).format(new Date(dashboard.generatedAt))}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCommanderDashboardCsv(dashboard)}
                  >
                    הורד דוח ל־Excel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={
                      isSharing ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <ShareIcon />
                      )
                    }
                    disabled={isSharing}
                    onClick={() => void handleShare()}
                  >
                    {isSharing ? "מכין את הדוח..." : "שתף כתמונה"}
                  </Button>
                </Box>
              </Paper>
            </>
          )}
        </Container>
      </AppLayout>

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
      />
      <MetricDetailsDialog
        detail={metricDetail}
        dashboard={dashboard}
        onClose={() => setMetricDetail(null)}
        onOpenMember={(member) => {
          setMetricDetail(null);
          setSelectedMember(member);
        }}
        onOpenTask={(task) => {
          setMetricDetail(null);
          setSelectedTask(task);
        }}
      />
      <MemberDialog
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
      <TaskDialog task={selectedTask} onClose={() => setSelectedTask(null)} />
      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={5000}
        onClose={() => setErrorMessage(null)}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={successMessage !== null}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
