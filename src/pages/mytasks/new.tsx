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
import { createTask } from "@/lib/createTask";
import { canManageTasks } from "@/lib/roles";
import { getTaskErrorMessage } from "@/lib/taskErrorMessages";
import { uploadTaskMedia } from "@/lib/uploadTaskMedia";
import type {
  CreateTaskErrorResponse,
  CreateTaskSuccessResponse,
} from "@/types/task";
import type { PublicUser } from "@/types/user";

export default function NewTaskPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      void router.replace("/");
      return;
    }

    if (!canManageTasks(session.user.role)) {
      void router.replace("/home");
      return;
    }

    setUser(session.user);
  }, [router]);

  const handleCancel = () => {
    void router.push("/mytasks");
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
        assignedTeams: task.assignedTeams,
        assignedUsers: task.assignedUsers,
        formFields: task.formFields,
      });

      if (!response.ok) {
        const { error } = data as CreateTaskErrorResponse;
        setErrorMessage(getTaskErrorMessage(error ?? "יצירת המטלה נכשלה"));
        return;
      }

      const { taskId } = data as CreateTaskSuccessResponse;

      if (task.pendingMedia.length > 0) {
        setIsSubmitting(false);
        setIsUploadingMedia(true);

        for (const file of task.pendingMedia) {
          const uploadResult = await uploadTaskMedia(taskId, user.id, file);

          if (!uploadResult.response.ok) {
            const { error } = uploadResult.data as { error?: string };
            setErrorMessage(
              getTaskErrorMessage(error ?? "העלאת הקובץ נכשלה"),
            );
            setIsUploadingMedia(false);
            return;
          }
        }

        setIsUploadingMedia(false);
      }

      void router.replace(`/tasks/${taskId}`);
    } catch {
      setErrorMessage("שגיאה ביצירת המטלה. נסה שוב.");
    } finally {
      setIsSubmitting(false);
      setIsUploadingMedia(false);
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
            מטלה חדשה
          </Typography>
          <TaskForm
            mode="create"
            isSubmitting={isSubmitting}
            isUploadingMedia={isUploadingMedia}
            onCancel={handleCancel}
            onError={(message) => setErrorMessage(message)}
            onSubmit={(task) => void handleCreateTask(task)}
          />
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
