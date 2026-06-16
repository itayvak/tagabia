import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Snackbar,
  Typography,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import TaskForm, { type TaskFormData } from "@/components/TaskForm";
import { getSession } from "@/lib/authStorage";
import { fetchTask } from "@/lib/fetchTask";
import { toDatetimeLocalValue } from "@/lib/taskDate";
import { getTaskErrorMessage } from "@/lib/taskErrorMessages";
import { updateTask } from "@/lib/updateTask";
import type {
  GetTaskErrorResponse,
  GetTaskSuccessResponse,
  PublicTask,
  UpdateTaskErrorResponse,
} from "@/types/task";
import type { PublicUser } from "@/types/user";

export default function EditTaskPage() {
  const router = useRouter();
  const taskId =
    typeof router.query.taskId === "string" ? router.query.taskId : "";

  const [user, setUser] = useState<PublicUser | null>(null);
  const [task, setTask] = useState<PublicTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user || !taskId || !router.isReady) {
      return;
    }

    const loadTask = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { response, data } = await fetchTask(taskId, user.id);

        if (!response.ok) {
          const { error } = data as GetTaskErrorResponse;
          setErrorMessage(getTaskErrorMessage(error ?? "טעינת המטלה נכשלה"));
          return;
        }

        const loadedTask = (data as GetTaskSuccessResponse).task;
        if (loadedTask.creatorId !== user.id) {
          setErrorMessage(getTaskErrorMessage("User is not the task creator"));
          return;
        }

        setTask(loadedTask);
      } catch {
        setErrorMessage("שגיאה בטעינת המטלה. נסה שוב.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTask();
  }, [user, taskId, router.isReady]);

  const handleCancel = () => {
    void router.push("/mytasks");
  };

  const handleUpdateTask = async (formData: TaskFormData) => {
    if (!user || !task) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { response, data } = await updateTask(task.id, {
        userId: user.id,
        title: formData.title,
        content: formData.content,
        dueDate: formData.dueDate,
        assignedTeams: formData.assignedTeams,
      });

      if (!response.ok) {
        const { error } = data as UpdateTaskErrorResponse;
        setErrorMessage(getTaskErrorMessage(error ?? "עדכון המטלה נכשל"));
        return;
      }

      void router.replace("/mytasks");
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout user={user}>
        <Container maxWidth="sm" sx={{ py: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            עריכת מטלה
          </Typography>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !task ? (
            <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
              לא ניתן לטעון את המטלה
            </Typography>
          ) : (
            <TaskForm
              mode="edit"
              isSubmitting={isSubmitting}
              initialValues={{
                title: task.title,
                content: task.content,
                dueDate: toDatetimeLocalValue(task.dueDate),
                assignedTeams: task.assignedTeams,
              }}
              onCancel={handleCancel}
              onError={(message) => setErrorMessage(message)}
              onSubmit={(formData) => void handleUpdateTask(formData)}
            />
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
