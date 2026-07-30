import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AppLayout from "@/components/AppLayout";
import AppTopBar from "@/components/AppTopBar";
import ProfileDrawer from "@/components/ProfileDrawer";
import TaskCard from "@/components/TaskCard";
import { getSession } from "@/lib/authStorage";
import { completeTask } from "@/lib/completeTask";
import { fetchAssignedTasks } from "@/lib/fetchAssignedTasks";
import {
  getPinnedTaskIds,
  prunePinnedTaskIds,
  togglePinnedTask,
} from "@/lib/pinnedTasksStorage";
import { triggerTaskConfetti } from "@/lib/taskConfetti";
import { uncompleteTask } from "@/lib/uncompleteTask";
import { TASK_CATEGORIES, type TaskCategory } from "@/lib/taskCategory";
import type {
  AssignedTask,
  CompleteTaskErrorResponse,
  CompleteTaskSuccessResponse,
  ListAssignedTasksSuccessResponse,
  ListTasksErrorResponse,
  UncompleteTaskErrorResponse,
} from "@/types/task";
import type { PublicUser } from "@/types/user";

type AllTasksTaskFilter = "pending" | "completed";

function toggleCategorySelection(
  selected: TaskCategory[],
  category: TaskCategory,
): TaskCategory[] {
  return selected.includes(category)
    ? selected.filter((item) => item !== category)
    : [...selected, category];
}

function getErrorMessage(error: string): string {
  switch (error) {
    case "User ID is required":
      return "מזהה משתמש חסר";
    case "List tasks failed":
      return "טעינת המטלות נכשלה";
    case "Task not found":
      return "המטלה לא נמצאה";
    case "User is not assigned to this task":
      return "אין לך הרשאה לסמן מטלה זו";
    case "Task already completed":
      return "המטלה כבר סומנה כבוצעה";
    case "Complete task failed":
      return "סימון המטלה נכשל";
    case "Task is not completed":
      return "המטלה לא סומנה כבוצעה";
    case "Uncomplete task failed":
      return "ביטול סימון המטלה נכשל";
    default:
      return error;
  }
}

export default function AllTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [taskFilter, setTaskFilter] = useState<AllTasksTaskFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<TaskCategory[]>(
    [],
  );
  const [pinnedTaskIds, setPinnedTaskIds] = useState<string[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [uncompletingTaskId, setUncompletingTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      void router.replace("/");
      return;
    }

    // Avoid triggering `react-hooks/set-state-in-effect` for this initial sync.
    void Promise.resolve().then(() => {
      setUser(session.user);
      setPinnedTaskIds(getPinnedTaskIds(session.user.id));
    });
  }, [router]);

  useEffect(() => {
    if (!user || tasks.length === 0) {
      return;
    }

    const validTaskIds = new Set(tasks.map((task) => task.id));
    setPinnedTaskIds((current) => {
      const pruned = prunePinnedTaskIds(user.id, validTaskIds);
      return pruned.length === current.length &&
        pruned.every((id, index) => id === current[index])
        ? current
        : pruned;
    });
  }, [user, tasks]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadTasks = async () => {
      setIsLoadingTasks(true);
      setErrorMessage(null);

      try {
        const { response, data } = await fetchAssignedTasks(user.id, "all");

        if (!response.ok) {
          const { error } = data as ListTasksErrorResponse;
          setErrorMessage(getErrorMessage(error ?? "טעינת המטלות נכשלה"));
          return;
        }

        setTasks((data as ListAssignedTasksSuccessResponse).tasks);
      } catch {
        setErrorMessage("שגיאה בטעינת המטלות. נסה שוב.");
      } finally {
        setIsLoadingTasks(false);
      }
    };

    void loadTasks();
  }, [user]);

  useEffect(() => {
    if (router.query.profile === "open") {
      setIsProfileOpen(true);
      const { profile: _profile, ...restQuery } = router.query;
      void router.replace(
        { pathname: router.pathname, query: restQuery },
        undefined,
        { shallow: true },
      );
    }
  }, [router]);

  const visibleTasks = useMemo(() => {
    const filtered =
      taskFilter === "pending"
        ? tasks.filter((task) => !task.completed)
        : tasks.filter((task) => task.completed);

    const query = searchQuery.trim().toLowerCase();
    const searchFiltered = query
      ? filtered.filter(
          (task) =>
            task.title.toLowerCase().includes(query) ||
            task.content.toLowerCase().includes(query) ||
            task.creatorName.toLowerCase().includes(query),
        )
      : filtered;

    const categoryFiltered =
      selectedCategories.length === 0
        ? searchFiltered
        : searchFiltered.filter((task) =>
            selectedCategories.includes(task.category),
          );

    const sorted = [...categoryFiltered].sort((a, b) => {
      if (taskFilter === "completed") {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime;
      }

      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    const pinnedSet = new Set(pinnedTaskIds);
    const pinned = pinnedTaskIds
      .map((id) => sorted.find((task) => task.id === id))
      .filter((task): task is AssignedTask => task !== undefined);
    const unpinned = sorted.filter((task) => !pinnedSet.has(task.id));

    return [...pinned, ...unpinned];
  }, [tasks, taskFilter, searchQuery, selectedCategories, pinnedTaskIds]);

  const handleTogglePin = (taskId: string) => {
    if (!user) {
      return;
    }

    setPinnedTaskIds(togglePinnedTask(user.id, taskId));
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) {
      return;
    }

    setCompletingTaskId(taskId);
    setErrorMessage(null);

    try {
      const { response, data } = await completeTask(taskId, {
        userId: user.id,
      });

      if (!response.ok) {
        const { error } = data as CompleteTaskErrorResponse;
        setErrorMessage(getErrorMessage(error ?? "סימון המטלה נכשל"));
        return;
      }

      const { completedAt } = data as CompleteTaskSuccessResponse;
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? { ...task, completed: true, completedAt }
            : task,
        ),
      );
      void triggerTaskConfetti();
    } catch {
      setErrorMessage("שגיאה בסימון המטלה. נסה שוב.");
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleUncompleteTask = async (taskId: string) => {
    if (!user) {
      return;
    }

    setUncompletingTaskId(taskId);
    setErrorMessage(null);

    try {
      const { response, data } = await uncompleteTask(taskId, {
        userId: user.id,
      });

      if (!response.ok) {
        const { error } = data as UncompleteTaskErrorResponse;
        setErrorMessage(getErrorMessage(error ?? "ביטול סימון המטלה נכשל"));
        return;
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? { ...task, completed: false, completedAt: null }
            : task,
        ),
      );
    } catch {
      setErrorMessage("שגיאה בביטול סימון המטלה. נסה שוב.");
    } finally {
      setUncompletingTaskId(null);
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
        <AppTopBar
          user={user}
          onProfileOpen={() => setIsProfileOpen(true)}
        />
        <Container maxWidth="sm" sx={{ pb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder='חיפוש תג"בייה...'
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
          <ToggleButtonGroup
            exclusive
            value={taskFilter}
            onChange={(_, value: AllTasksTaskFilter | null) => {
              if (value) {
                setTaskFilter(value);
              }
            }}
            size="small"
            color="primary"
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="pending">פתוחות</ToggleButton>
            <ToggleButton value="completed">בוצעו</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            pb: 0.5,
            mb: 2,
          }}
        >
          <Chip
            label="הכל"
            clickable
            color={selectedCategories.length === 0 ? "primary" : "default"}
            variant={selectedCategories.length === 0 ? "filled" : "outlined"}
            onClick={() => setSelectedCategories([])}
          />
          {TASK_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category);

            return (
              <Chip
                key={category}
                label={category}
                clickable
                color={isSelected ? "primary" : "default"}
                variant={isSelected ? "filled" : "outlined"}
                onClick={() =>
                  setSelectedCategories((current) =>
                    toggleCategorySelection(current, category),
                  )
                }
                sx={{ flexShrink: 0 }}
              />
            );
          })}
        </Box>
        {isLoadingTasks ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : visibleTasks.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            {searchQuery.trim() || selectedCategories.length > 0
              ? "לא נמצאו מטלות"
              : taskFilter === "pending"
                ? "איזה כיף! סיימת את כל המטלות"
                : "אין מטלות שבוצעו"}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isCompleting={completingTaskId === task.id}
                isUncompleting={uncompletingTaskId === task.id}
                isCompleted={task.completed}
                completedAt={task.completedAt}
                isPinned={pinnedTaskIds.includes(task.id)}
                onTogglePin={handleTogglePin}
                onOpen={(taskId) => void router.push(`/tasks/${taskId}`)}
                onComplete={(taskId) => void handleCompleteTask(taskId)}
                onUncomplete={(taskId) => void handleUncompleteTask(taskId)}
              />
            ))}
          </Box>
        )}
      </Container>
        <ProfileDrawer
          open={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
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
    </>
  );
}
