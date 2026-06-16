import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  Snackbar,
  Typography,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import { APP_BOTTOM_BAR_HEIGHT } from "@/components/AppBottomBar";
import CreatedTaskCard from "@/components/CreatedTaskCard";
import TaskCompletionsDialog from "@/components/TaskCompletionsDialog";
import { getSession } from "@/lib/authStorage";
import { deleteTask } from "@/lib/deleteTask";
import { fetchCreatedTasks } from "@/lib/fetchCreatedTasks";
import { fetchTaskCompletions } from "@/lib/fetchTaskCompletions";
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

export default function MyTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completionsTask, setCompletionsTask] = useState<PublicTask | null>(
    null,
  );
  const [assigneeStatuses, setAssigneeStatuses] = useState<TaskAssigneeStatus[]>(
    [],
  );
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(false);
  const [deletingTask, setDeletingTask] = useState<PublicTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      void router.replace("/");
      return;
    }

    if (session.user.role === "peasant") {
      void router.replace("/home");
      return;
    }

    setUser(session.user);
  }, [router]);

  const loadTasks = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoadingTasks(true);
    setErrorMessage(null);

    try {
      const { response, data } = await fetchCreatedTasks(user.id);

      if (!response.ok) {
        const { error } = data as ListTasksErrorResponse;
        setErrorMessage(getTaskErrorMessage(error ?? "טעינת המטלות נכשלה"));
        return;
      }

      setTasks((data as ListTasksSuccessResponse).tasks);
    } catch {
      setErrorMessage("שגיאה בטעינת המטלות. נסה שוב.");
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleOpenCompletions = async (task: PublicTask) => {
    if (!user) {
      return;
    }

    setCompletionsTask(task);
    setAssigneeStatuses([]);
    setIsLoadingCompletions(true);
    setErrorMessage(null);

    try {
      const { response, data } = await fetchTaskCompletions(
        task.id,
        user.id,
      );

      if (!response.ok) {
        const { error } = data as ListTaskCompletionsErrorResponse;
        setErrorMessage(getTaskErrorMessage(error ?? "טעינת הביצועים נכשלה"));
        setCompletionsTask(null);
        return;
      }

      setAssigneeStatuses(
        (data as ListTaskCompletionsSuccessResponse).assignees,
      );
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
      setTasks((currentTasks) =>
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
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout user={user}>
        <Container maxWidth="sm" sx={{ py: 3 }}>
        {isLoadingTasks ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : tasks.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            אין מטלות שיצרת
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {tasks.map((task) => (
              <CreatedTaskCard
                key={task.id}
                task={task}
                isDeleting={deletingTaskId === task.id}
                onOpen={(taskId) => void router.push(`/tasks/${taskId}`)}
                onEdit={() => void router.push(`/mytasks/${task.id}/edit`)}
                onViewCompletions={() => void handleOpenCompletions(task)}
                onDelete={() => handleOpenDelete(task)}
              />
            ))}
          </Box>
        )}
      </Container>
      <Fab
        variant="extended"
        color="primary"
        onClick={() => void router.push("/mytasks/new")}
        sx={{
          position: "fixed",
          bottom: APP_BOTTOM_BAR_HEIGHT + 16,
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
        isLoading={isLoadingCompletions}
        assignees={assigneeStatuses}
        onClose={handleCloseCompletions}
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
