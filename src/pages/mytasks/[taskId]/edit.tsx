import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
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
  Snackbar,
  Typography,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import TaskForm, { type TaskFormData } from "@/components/TaskForm";
import { getSession } from "@/lib/authStorage";
import { fetchTask } from "@/lib/fetchTask";
import { canManageTasks } from "@/lib/roles";
import { toDatetimeLocalValue } from "@/lib/taskDate";
import { getTaskErrorMessage } from "@/lib/taskErrorMessages";
import { haveFormFieldsChanged } from "@/lib/taskFormValidation";
import { updateTask } from "@/lib/updateTask";
import type {
  GetTaskErrorResponse,
  GetTaskSuccessResponse,
  PublicTask,
  UpdateTaskErrorResponse,
} from "@/types/task";
import type { TaskFormFieldInput } from "@/types/taskForm";
import type { PublicUser } from "@/types/user";

export default function EditTaskPage() {
  const router = useRouter();
  const taskId =
    typeof router.query.taskId === "string" ? router.query.taskId : "";

  const [user, setUser] = useState<PublicUser | null>(null);
  const [task, setTask] = useState<PublicTask | null>(null);
  const [initialFormFields, setInitialFormFields] = useState<TaskFormFieldInput[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingFormData, setPendingFormData] = useState<TaskFormData | null>(
    null,
  );
  const [isConfirmFormEditOpen, setIsConfirmFormEditOpen] = useState(false);

  const initialFormValues = useMemo(() => {
    if (!task) {
      return undefined;
    }

    return {
      title: task.title,
      content: task.content,
      category: task.category,
      dueDate: toDatetimeLocalValue(task.dueDate),
      assignedTeams: task.assignedTeams,
      assignedUsers: task.assignedUsers,
      formFields: task.formFields ?? [],
      pendingMedia: [],
    };
  }, [task]);

  const formFieldsWarningMessage = useMemo(() => {
    const submissionCount = task?.submissionCount ?? 0;
    if (submissionCount <= 0) {
      return null;
    }

    return `יש כבר ${submissionCount} תשובות לטופס זה. שינוי השדות עלול לפגוע בנתונים קיימים.`;
  }, [task?.submissionCount]);

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

        const loadedFormFields = loadedTask.formFields ?? [];
        setTask(loadedTask);
        setInitialFormFields(loadedFormFields);
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

  const performUpdate = async (formData: TaskFormData) => {
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
        category: formData.category,
        dueDate: formData.dueDate,
        assignedTeams: formData.assignedTeams,
        assignedUsers: formData.assignedUsers,
        formFields: formData.formFields,
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

  const handleUpdateTask = async (formData: TaskFormData) => {
    const submissionCount = task?.submissionCount ?? 0;
    const formFieldsChanged = haveFormFieldsChanged(
      initialFormFields,
      formData.formFields,
    );

    if (submissionCount > 0 && formFieldsChanged) {
      setPendingFormData(formData);
      setIsConfirmFormEditOpen(true);
      return;
    }

    await performUpdate(formData);
  };

  const handleConfirmFormEdit = async () => {
    if (!pendingFormData) {
      return;
    }

    setIsConfirmFormEditOpen(false);
    await performUpdate(pendingFormData);
    setPendingFormData(null);
  };

  const handleCancelFormEdit = () => {
    setIsConfirmFormEditOpen(false);
    setPendingFormData(null);
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
              taskId={task.id}
              userId={user.id}
              initialMedia={task.media}
              formFieldsWarningMessage={formFieldsWarningMessage}
              initialValues={initialFormValues}
              onCancel={handleCancel}
              onError={(message) => setErrorMessage(message)}
              onSubmit={(formData) => void handleUpdateTask(formData)}
            />
          )}
        </Container>
      </AppLayout>
      <Dialog
        open={isConfirmFormEditOpen}
        onClose={handleCancelFormEdit}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>שינוי שדות הטופס</DialogTitle>
        <DialogContent>
          <DialogContentText>
            כבר התקבלו {task?.submissionCount ?? 0} תשובות לטופס זה. שינוי השדות
            עלול לגרום לתשובות קיימות להיראות לא שלמות או לא תקינות. האם להמשיך
            בשמירה?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelFormEdit} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={isSubmitting}
            onClick={() => void handleConfirmFormEdit()}
          >
            {isSubmitting ? "שומר..." : "שמור בכל זאת"}
          </Button>
        </DialogActions>
      </Dialog>
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
