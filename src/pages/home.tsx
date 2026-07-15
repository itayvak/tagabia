import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import TaskCard from "@/components/TaskCard";
import { getSession } from "@/lib/authStorage";
import { completeTask } from "@/lib/completeTask";
import { fetchAssignedTasks } from "@/lib/fetchAssignedTasks";
import { getDailySplashQuote } from "@/lib/splashQuotes";
import { triggerTaskConfetti } from "@/lib/taskConfetti";
import type {
  AssignedTask,
  CompleteTaskErrorResponse,
  CompleteTaskSuccessResponse,
  ListAssignedTasksSuccessResponse,
  ListTasksErrorResponse,
} from "@/types/task";
import type { PublicUser } from "@/types/user";

type HomepageTaskFilter = "pending" | "completed";

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
    default:
      return error;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [taskFilter, setTaskFilter] = useState<HomepageTaskFilter>("pending");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      void router.replace("/");
      return;
    }

    // Avoid triggering `react-hooks/set-state-in-effect` for this initial sync.
    void Promise.resolve().then(() => {
      setUser(session.user);
    });
  }, [router]);

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

  const visibleTasks = useMemo(() => {
    const filtered =
      taskFilter === "pending"
        ? tasks.filter((task) => !task.completed)
        : tasks.filter((task) => task.completed);

    // Keep the same sorting behavior as the server-side implementation.
    if (taskFilter === "completed") {
      return filtered.sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    return filtered.sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks, taskFilter]);

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

  const dailyQuote = getDailySplashQuote();

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout user={user}>
        <Container maxWidth="sm" sx={{ py: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <Box
              component="img"
              src="/bahad1.png"
              alt="בה״ד 1"
              sx={{ width: 52, height: 52 }}
            />
            <Typography variant="h5" component="h1">
              תג&quot;ביה
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "baseline",
              gap: 0.75,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              &ldquo;{dailyQuote.text}&rdquo;
            </Typography>
            {dailyQuote.author ? (
              <Typography variant="caption" color="text.secondary">
                - {dailyQuote.author}
              </Typography>
            ) : null}
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <ToggleButtonGroup
            exclusive
            value={taskFilter}
            onChange={(_, value: HomepageTaskFilter | null) => {
              if (value) {
                setTaskFilter(value);
              }
            }}
            size="small"
            color="primary"
          >
            <ToggleButton value="pending">פתוחות</ToggleButton>
            <ToggleButton value="completed">בוצעו</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {isLoadingTasks ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : visibleTasks.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            {taskFilter === "pending"
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
                isCompleted={task.completed}
                completedAt={task.completedAt}
                onOpen={(taskId) => void router.push(`/tasks/${taskId}`)}
                onComplete={(taskId) => void handleCompleteTask(taskId)}
              />
            ))}
          </Box>
        )}
      </Container>
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
