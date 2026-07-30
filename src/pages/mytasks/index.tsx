import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  InputAdornment,
  ListItemText,
  MenuItem,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import SearchIcon from "@mui/icons-material/Search";
import AppLayout from "@/components/AppLayout";
import { appBottomOffset } from "@/components/AppBottomBar";
import CreatedTaskCard from "@/components/CreatedTaskCard";
import TaskCompletionsDialog from "@/components/TaskCompletionsDialog";
import TaskReportShareDialog from "@/components/TaskReportShareDialog";
import TaskSubmissionsDialog from "@/components/TaskSubmissionsDialog";
import { getSession, updateSessionUser } from "@/lib/authStorage";
import { deleteTask } from "@/lib/deleteTask";
import { fetchCurrentUser } from "@/lib/fetchCurrentUser";
import { getTeamsForPlatoon } from "@/lib/platoons";
import {
  canManageTasks,
  getRoleLabel,
  isBattalionRole,
  ROLE_LIST,
  type Role,
} from "@/lib/roles";
import { fetchPlatoonScopeTasks } from "@/lib/fetchPlatoonScopeTasks";
import { fetchCreatedTasks } from "@/lib/fetchCreatedTasks";
import { fetchSubordinateTasks } from "@/lib/fetchSubordinateTasks";
import { fetchTaskCompletions } from "@/lib/fetchTaskCompletions";
import { fetchTaskSubmissions } from "@/lib/fetchTaskSubmissions";
import { getTaskErrorMessage } from "@/lib/taskErrorMessages";
import type {
  DeleteTaskErrorResponse,
  ListTaskCompletionsErrorResponse,
  ListTaskCompletionsSuccessResponse,
  ListTasksErrorResponse,
  ListTasksSuccessResponse,
  PublicTask,
  TaskAssigneeStatus,
} from "@/types/task";
import type { PublicUser } from "@/types/user";
import type {
  ListTaskSubmissionsErrorResponse,
  ListTaskSubmissionsSuccessResponse,
  TaskFormField,
  TaskSubmissionEntry,
} from "@/types/taskForm";

type MyTasksTab = "created" | "assigned";

export default function MyTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [activeTab, setActiveTab] = useState<MyTasksTab>("created");
  const [createdTasks, setCreatedTasks] = useState<PublicTask[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<PublicTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completionsTask, setCompletionsTask] = useState<PublicTask | null>(
    null,
  );
  const [assigneeStatuses, setAssigneeStatuses] = useState<TaskAssigneeStatus[]>(
    [],
  );
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(false);
  const [submissionsTask, setSubmissionsTask] = useState<PublicTask | null>(
    null,
  );
  const [submissionFormFields, setSubmissionFormFields] = useState<
    TaskFormField[]
  >([]);
  const [submissions, setSubmissions] = useState<TaskSubmissionEntry[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionsInitialUserId, setSubmissionsInitialUserId] = useState<
    string | null
  >(null);
  const [deletingTask, setDeletingTask] = useState<PublicTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCreatorRoles, setSelectedCreatorRoles] = useState<Role[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | "">("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      void router.replace("/");
      return;
    }

    if (!canManageTasks(session.user.role)) {
      void router.replace("/allTasks");
      return;
    }

    const syncUser = async () => {
      try {
        const { response, data } = await fetchCurrentUser(session.user.id);
        if (response.ok && "user" in data) {
          updateSessionUser(data.user);
          setUser(data.user);
          return;
        }
      } catch {
        // Fall back to the cached session when refresh fails.
      }

      setUser(session.user);
    };

    void syncUser();
  }, [router]);

  const loadTasks = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoadingTasks(true);
    setErrorMessage(null);

    try {
      const [createdResult, platoonScopeResult, subordinateResult] =
        await Promise.all([
          fetchCreatedTasks(user.id),
          fetchPlatoonScopeTasks(user.id),
          fetchSubordinateTasks(user.id),
        ]);

      if (!createdResult.response.ok) {
        const { error } = createdResult.data as ListTasksErrorResponse;
        setErrorMessage(getTaskErrorMessage(error ?? "טעינת המטלות נכשלה"));
        return;
      }

      if (!platoonScopeResult.response.ok) {
        const { error } = platoonScopeResult.data as ListTasksErrorResponse;
        setErrorMessage(getTaskErrorMessage(error ?? "טעינת המטלות נכשלה"));
        return;
      }

      if (!subordinateResult.response.ok) {
        const { error } = subordinateResult.data as ListTasksErrorResponse;
        setErrorMessage(getTaskErrorMessage(error ?? "טעינת המטלות נכשלה"));
        return;
      }

      const platoonScopeTasks = (
        platoonScopeResult.data as ListTasksSuccessResponse
      ).tasks.filter((task) => task.creatorId !== user.id);

      const subordinateTasks = (
        subordinateResult.data as ListTasksSuccessResponse
      ).tasks;

      // Merge subordinate tasks, avoiding duplicates already in platoonScopeTasks
      const platoonScopeTaskIds = new Set(platoonScopeTasks.map((t) => t.id));
      const newSubordinateTasks = subordinateTasks.filter(
        (t) => !platoonScopeTaskIds.has(t.id),
      );

      setCreatedTasks((createdResult.data as ListTasksSuccessResponse).tasks);
      setAssignedTasks([...platoonScopeTasks, ...newSubordinateTasks]);
    } catch {
      setErrorMessage("שגיאה בטעינת המטלות. נסה שוב.");
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const activeTasks = activeTab === "created" ? createdTasks : assignedTasks;

  const allRolesSorted = useMemo(
    () =>
      [...ROLE_LIST]
        .filter((role) => role !== "peasant" && role !== "commander")
        .sort((a, b) =>
          getRoleLabel(a).localeCompare(getRoleLabel(b), "he"),
        ),
    [],
  );

  const platoonTeams = useMemo(
    () => (user ? getTeamsForPlatoon(user.platoon) : []),
    [user],
  );

  const reportTasks = useMemo(
    () => [...createdTasks, ...assignedTasks],
    [createdTasks, assignedTasks],
  );

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let tasks = [...activeTasks];

    if (activeTab === "assigned") {
      if (selectedCreatorRoles.length > 0) {
        tasks = tasks.filter((task) =>
          selectedCreatorRoles.includes(task.creatorRole),
        );
      }

      if (selectedTeam !== "") {
        tasks = tasks.filter(
          (task) =>
            task.assignedTeams.length === 1 &&
            task.assignedTeams[0] === selectedTeam,
        );
      }
    }

    const sorted = tasks.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
    );

    if (!query) {
      return sorted;
    }

    return sorted.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.content.toLowerCase().includes(query),
    );
  }, [
    activeTasks,
    activeTab,
    searchQuery,
    selectedCreatorRoles,
    selectedTeam,
  ]);

  const submittedUserIds = useMemo(
    () => submissions.map((submission) => submission.userId),
    [submissions],
  );

  const handleOpenCompletions = async (task: PublicTask) => {
    if (!user) {
      return;
    }

    setCompletionsTask(task);
    setAssigneeStatuses([]);
    setSubmissions([]);
    setSubmissionFormFields([]);
    setIsLoadingCompletions(true);
    setErrorMessage(null);

    try {
      const completionsPromise = fetchTaskCompletions(task.id, user.id);
      const submissionsPromise = task.hasFormFields
        ? fetchTaskSubmissions(task.id, user.id)
        : null;

      const completionsResult = await completionsPromise;
      const submissionsResult = submissionsPromise
        ? await submissionsPromise
        : null;

      if (!completionsResult.response.ok) {
        const { error } = completionsResult.data as ListTaskCompletionsErrorResponse;
        setErrorMessage(getTaskErrorMessage(error ?? "טעינת הביצועים נכשלה"));
        setCompletionsTask(null);
        return;
      }

      setAssigneeStatuses(
        (completionsResult.data as ListTaskCompletionsSuccessResponse).assignees,
      );

      if (submissionsResult) {
        if (!submissionsResult.response.ok) {
          const { error } = submissionsResult.data as ListTaskSubmissionsErrorResponse;
          setErrorMessage(getTaskErrorMessage(error ?? "טעינת התשובות נכשלה"));
          return;
        }

        const successData =
          submissionsResult.data as ListTaskSubmissionsSuccessResponse;
        setSubmissionFormFields(successData.formFields);
        setSubmissions(successData.submissions);
      }
    } catch {
      setErrorMessage("שגיאה בטעינת הביצועים. נסה שוב.");
      setCompletionsTask(null);
    } finally {
      setIsLoadingCompletions(false);
    }
  };

  const handleCloseCompletions = () => {
    setCompletionsTask(null);
    setAssigneeStatuses([]);
    setSubmissions([]);
    setSubmissionFormFields([]);
  };

  const handleOpenSubmissions = async (
    task: PublicTask,
    initialUserId: string | null = null,
  ) => {
    if (!user) {
      return;
    }

    setSubmissionsTask(task);
    setSubmissionsInitialUserId(initialUserId);
    setSubmissionFormFields([]);
    setSubmissions([]);
    setIsLoadingSubmissions(true);
    setErrorMessage(null);

    const needsAssigneeCount = assigneeStatuses.length === 0 || completionsTask?.id !== task.id;

    if (needsAssigneeCount) {
      setIsLoadingCompletions(true);
    }

    try {
      const submissionsPromise = fetchTaskSubmissions(task.id, user.id);
      const completionsPromise = needsAssigneeCount
        ? fetchTaskCompletions(task.id, user.id)
        : null;

      const submissionsResult = await submissionsPromise;
      const completionsResult = completionsPromise
        ? await completionsPromise
        : null;

      if (!submissionsResult.response.ok) {
        const { error } = submissionsResult.data as ListTaskSubmissionsErrorResponse;
        setErrorMessage(getTaskErrorMessage(error ?? "טעינת התשובות נכשלה"));
        setSubmissionsTask(null);
        return;
      }

      const successData =
        submissionsResult.data as ListTaskSubmissionsSuccessResponse;
      setSubmissionFormFields(successData.formFields);
      setSubmissions(successData.submissions);

      if (completionsResult) {
        if (!completionsResult.response.ok) {
          const { error } = completionsResult.data as ListTaskCompletionsErrorResponse;
          setErrorMessage(getTaskErrorMessage(error ?? "טעינת הביצועים נכשלה"));
          setSubmissionsTask(null);
          return;
        }

        setAssigneeStatuses(
          (completionsResult.data as ListTaskCompletionsSuccessResponse).assignees,
        );
      }
    } catch {
      setErrorMessage("שגיאה בטעינת התשובות. נסה שוב.");
      setSubmissionsTask(null);
    } finally {
      setIsLoadingSubmissions(false);
      if (needsAssigneeCount) {
        setIsLoadingCompletions(false);
      }
    }
  };

  const handleViewSubmissionFromCompletions = (userId: string) => {
    if (!completionsTask) {
      return;
    }

    setSubmissionsInitialUserId(userId);
    setSubmissionsTask(completionsTask);
    setCompletionsTask(null);
    setIsLoadingSubmissions(false);
  };

  const handleViewAllSubmissionsFromCompletions = () => {
    if (!completionsTask) {
      return;
    }

    setSubmissionsInitialUserId(null);
    setSubmissionsTask(completionsTask);
    setCompletionsTask(null);
    setIsLoadingSubmissions(false);
  };

  const handleCloseSubmissions = () => {
    setSubmissionsTask(null);
    setSubmissionFormFields([]);
    setSubmissions([]);
    setSubmissionsInitialUserId(null);
  };

  const handleOpenDelete = (task: PublicTask) => {
    setDeletingTask(task);
  };

  const handleCloseDelete = () => {
    if (deletingTaskId) {
      return;
    }

    setDeletingTask(null);
  };

  const handleDeleteTask = async () => {
    if (!user || !deletingTask) {
      return;
    }

    setDeletingTaskId(deletingTask.id);
    setErrorMessage(null);

    try {
      const { response, data } = await deleteTask(deletingTask.id, {
        userId: user.id,
      });

      if (!response.ok) {
        const { error } = data as DeleteTaskErrorResponse;
        setErrorMessage(getTaskErrorMessage(error ?? "מחיקת המטלה נכשלה"));
        return;
      }

      setDeletingTask(null);
      setCreatedTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== deletingTask.id),
      );
    } catch {
      setErrorMessage("שגיאה במחיקת המטלה. נסה שוב.");
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
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
      <AppLayout user={user}>
        <Container maxWidth="sm" sx={{ py: 3 }}>
        <ToggleButtonGroup
          exclusive
          value={activeTab}
          onChange={(_, value: MyTasksTab | null) => {
            if (value) {
              setActiveTab(value);
              if (value !== "assigned") {
                setSelectedCreatorRoles([]);
                setSelectedTeam("");
              }
            }
          }}
          fullWidth
          size="small"
          color="primary"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="created">מטלות שיצרתי</ToggleButton>
          <ToggleButton value="assigned">מטלות פלוגתיות</ToggleButton>
        </ToggleButtonGroup>
        {isLoadingTasks ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : activeTasks.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            {activeTab === "created"
              ? "אין מטלות שיצרת"
              : "אין מטלות פלוגתיות"}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                fullWidth
                size="small"
                placeholder="חיפוש מטלות..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
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
              <Button
                variant="outlined"
                size="small"
                startIcon={<ImageIcon />}
                onClick={() => setIsReportDialogOpen(true)}
                sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
              >
                שתף דוח
              </Button>
            </Box>
            {activeTab === "assigned" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="תפקיד אחראי"
                  value={selectedCreatorRoles}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedCreatorRoles(
                      typeof value === "string" ? [] : value,
                    );
                  }}
                  slotProps={{
                    select: {
                      multiple: true,
                      renderValue: (selected) => {
                        const roles = selected as Role[];
                        if (roles.length === 0) {
                          return "הכל";
                        }

                        return roles.map(getRoleLabel).join(", ");
                      },
                    },
                  }}
                >
                  {allRolesSorted.map((role) => (
                    <MenuItem key={role} value={role}>
                      <Checkbox
                        checked={selectedCreatorRoles.includes(role)}
                        size="small"
                        sx={{ py: 0, mr: 1 }}
                      />
                      <ListItemText primary={getRoleLabel(role)} />
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="צוות משויך"
                  value={selectedTeam}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedTeam(value === "" ? "" : Number(value));
                  }}
                >
                  <MenuItem value="">הכל</MenuItem>
                  {platoonTeams.map((team) => (
                    <MenuItem key={team} value={team}>
                      צוות {team}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            ) : null}
            {filteredTasks.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                לא נמצאו מטלות
              </Typography>
            ) : (
              filteredTasks.map((task) => (
                <CreatedTaskCard
                  key={task.id}
                  task={task}
                  isDeleting={deletingTaskId === task.id}
                  canEdit={activeTab === "created"}
                  canDelete={activeTab === "created"}
                  showCreator={activeTab === "assigned"}
                  onOpen={(taskId) => void router.push(`/tasks/${taskId}`)}
                  onEdit={() => void router.push(`/mytasks/${task.id}/edit`)}
                  onViewCompletions={() => void handleOpenCompletions(task)}
                  onViewSubmissions={() => void handleOpenSubmissions(task)}
                  onDelete={() => handleOpenDelete(task)}
                />
              ))
            )}
          </Box>
        )}
      </Container>
      <Fab
        variant="extended"
        color="primary"
        onClick={() => void router.push("/mytasks/new")}
        sx={{
          position: "fixed",
          bottom: appBottomOffset(16),
          insetInlineEnd: 24,
        }}
      >
        מטלה חדשה
      </Fab>
      <Dialog
        open={deletingTask !== null}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>מחיקת מטלה</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך למחוק את &quot;{deletingTask?.title}&quot;?
            פעולה זו אינה ניתנת לביטול.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDelete} disabled={deletingTaskId !== null}>
            ביטול
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deletingTaskId !== null}
            onClick={() => void handleDeleteTask()}
          >
            {deletingTaskId ? "מוחק..." : "מחיקה"}
          </Button>
        </DialogActions>
      </Dialog>
      <TaskCompletionsDialog
        open={completionsTask !== null}
        taskTitle={completionsTask?.title ?? ""}
        dueDate={completionsTask?.dueDate ?? ""}
        isLoading={isLoadingCompletions}
        assignees={assigneeStatuses}
        hasFormFields={completionsTask?.hasFormFields ?? false}
        submittedUserIds={submittedUserIds}
        assignedTeams={completionsTask?.assignedTeams ?? []}
        groupByTeam={isBattalionRole(user.role)}
        onClose={handleCloseCompletions}
        onViewSubmission={
          completionsTask?.hasFormFields
            ? handleViewSubmissionFromCompletions
            : undefined
        }
        onViewAllSubmissions={
          completionsTask?.hasFormFields
            ? handleViewAllSubmissionsFromCompletions
            : undefined
        }
      />
      <TaskSubmissionsDialog
        open={submissionsTask !== null}
        taskTitle={submissionsTask?.title ?? ""}
        isLoading={isLoadingSubmissions}
        formFields={submissionFormFields}
        submissions={submissions}
        totalAssignees={assigneeStatuses.length}
        initialUserId={submissionsInitialUserId}
        onClose={handleCloseSubmissions}
      />
      <TaskReportShareDialog
        open={isReportDialogOpen}
        tasks={reportTasks}
        userId={user.id}
        onClose={() => setIsReportDialogOpen(false)}
        onError={setErrorMessage}
        onSuccess={setSuccessMessage}
      />
      </AppLayout>
      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={5000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={successMessage !== null}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
