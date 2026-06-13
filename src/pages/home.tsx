import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
import { triggerTaskConfetti } from "@/lib/taskConfetti";
import type {
  AssignedTask,
  AssignedTaskFilter,
  CompleteTaskErrorResponse,
  ListAssignedTasksSuccessResponse,
  ListTasksErrorResponse,
} from "@/types/task";
import type { PublicUser } from "@/types/user";

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
  const [taskFilter, setTaskFilter] = useState<AssignedTaskFilter>("pending");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      void router.replace("/");
      return;
    }

    setUser(session.user);
  }, [router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadTasks = async () => {
      setIsLoadingTasks(true);
      setErrorMessage(null);

      try {
        const { response, data } = await fetchAssignedTasks(user.id, taskFilter);

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
  }, [user, taskFilter]);

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

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
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
            mb: 3,
          }}
        >
          <Box
            component="img"
            src="/bahad1.png"
            alt="בה״ד 1"
            sx={{ width: 72, height: 72, mb: 1 }}
          />
          <Typography variant="h5" component="h1">
            תג&quot;ביה
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <ToggleButtonGroup
            exclusive
            value={taskFilter}
            onChange={(_, value: AssignedTaskFilter | null) => {
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
        ) : tasks.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            {taskFilter === "pending"
              ? "איזה כיף! סיימת את כל המטלות"
              : "אין מטלות שבוצעו"}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {tasks.map((task) => (
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
