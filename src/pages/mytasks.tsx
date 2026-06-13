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
import TaskFormDialog, { type TaskFormData } from "@/components/TaskFormDialog";
import { getSession } from "@/lib/authStorage";
import { createTask } from "@/lib/createTask";
import { deleteTask } from "@/lib/deleteTask";
import { fetchCreatedTasks } from "@/lib/fetchCreatedTasks";
import { fetchTaskCompletions } from "@/lib/fetchTaskCompletions";
import { toDatetimeLocalValue } from "@/lib/taskDate";
import { updateTask } from "@/lib/updateTask";
import type {
  CreateTaskErrorResponse,
  DeleteTaskErrorResponse,
  ListTaskCompletionsErrorResponse,
  ListTaskCompletionsSuccessResponse,
  ListTasksErrorResponse,
  ListTasksSuccessResponse,
  PublicTask,
  TaskAssigneeStatus,
  UpdateTaskErrorResponse,
} from "@/types/task";
import type { PublicUser } from "@/types/user";

function getErrorMessage(error: string): string {
  switch (error) {
    case "Title is required":
      return "יש להזין כותרת";
    case "Content is required":
      return "יש להזין תוכן";
    case "Due date is required":
      return "יש לבחור תאריך ושעת יעד";
    case "Invalid due date":
      return "תאריך ושעת יעד לא תקינים";
    case "Creator not found":
      return "יוצר המטלה לא נמצא";
    case "One or more assignees not found":
      return "אחד או יותר מהממונים לא נמצאו";
    case "Assignees must be a list of user IDs":
      return "יש לבחור חיילים למטלה";
    case "At least one assignee is required":
      return "יש לבחור לפחות חייל אחד";
    case "Create task failed":
      return "יצירת המטלה נכשלה";
    case "Task not found":
      return "המטלה לא נמצאה";
    case "User is not the task creator":
      return "אין לך הרשאה לערוך מטלה זו";
    case "Update task failed":
      return "עדכון המטלה נכשל";
    case "Delete task failed":
      return "מחיקת המטלה נכשלה";
    case "List tasks failed":
      return "טעינת המטלות נכשלה";
    case "Creator ID is required":
      return "מזהה יוצר חסר";
    case "List completions failed":
      return "טעינת הביצועים נכשלה";
    default:
      return error;
  }
}

export default function MyTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingTask, setEditingTask] = useState<PublicTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        setErrorMessage(getErrorMessage(error ?? "טעינת המטלות נכשלה"));
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

  const handleOpenCreate = () => {
    setEditingTask(null);
    setDialogMode("create");
  };

  const handleOpenEdit = (task: PublicTask) => {
    setEditingTask(task);
    setDialogMode("edit");
  };

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
        setErrorMessage(getErrorMessage(error ?? "טעינת הביצועים נכשלה"));
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

  const handleCloseDialog = () => {
    if (isSubmitting) {
      return;
    }

    setDialogMode(null);
    setEditingTask(null);
  };

  const handleCreateTask = async (task: TaskFormData) => {
    if (!user) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { response, data } = await createTask({
        title: task.title,
        content: task.content,
        creatorId: user.id,
        dueDate: task.dueDate,
        assignees: task.assignees,
      });

      if (!response.ok) {
        const { error } = data as CreateTaskErrorResponse;
        setErrorMessage(getErrorMessage(error ?? "יצירת המטלה נכשלה"));
        return;
      }

      setDialogMode(null);
      await loadTasks();
    } catch {
      setErrorMessage("שגיאה ביצירת המטלה. נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
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
        setErrorMessage(getErrorMessage(error ?? "מחיקת המטלה נכשלה"));
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

  const handleUpdateTask = async (task: TaskFormData) => {
    if (!user || !editingTask) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { response, data } = await updateTask(editingTask.id, {
        userId: user.id,
        title: task.title,
        content: task.content,
        dueDate: task.dueDate,
        assignees: task.assignees,
      });

      if (!response.ok) {
        const { error } = data as UpdateTaskErrorResponse;
        setErrorMessage(getErrorMessage(error ?? "עדכון המטלה נכשל"));
        return;
      }

      setDialogMode(null);
      setEditingTask(null);
      await loadTasks();
    } catch {
      setErrorMessage("שגיאה בעדכון המטלה. נסה שוב.");
    } finally {
      setIsSubmitting(false);
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
        <title>מטלות שלי | תגביה</title>
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
                onEdit={() => handleOpenEdit(task)}
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
        onClick={handleOpenCreate}
        sx={{
          position: "fixed",
          bottom: APP_BOTTOM_BAR_HEIGHT + 16,
          insetInlineEnd: 24,
        }}
      >
        מטלה חדשה
      </Fab>
      <TaskFormDialog
        open={dialogMode !== null}
        mode={dialogMode ?? "create"}
        isSubmitting={isSubmitting}
        initialValues={
          editingTask
            ? {
                title: editingTask.title,
                content: editingTask.content,
                dueDate: toDatetimeLocalValue(editingTask.dueDate),
                assignees: editingTask.assignees,
              }
            : undefined
        }
        onClose={handleCloseDialog}
        onError={(message) => setErrorMessage(message)}
        onSubmit={(task) =>
          void (dialogMode === "edit"
            ? handleUpdateTask(task)
            : handleCreateTask(task))
        }
      />
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
