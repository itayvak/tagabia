import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
  Divider,
  Snackbar,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import AppLayout from "@/components/AppLayout";
import { getSession } from "@/lib/authStorage";
import { completeTask } from "@/lib/completeTask";
import { fetchTask } from "@/lib/fetchTask";
import { getRoleLabel } from "@/lib/roleLabels";
import { formatDaysLeft, formatDueDate } from "@/lib/taskDate";
import type {
  CompleteTaskErrorResponse,
  GetTaskErrorResponse,
  GetTaskSuccessResponse,
  PublicTask,
} from "@/types/task";
import type { PublicUser } from "@/types/user";

function getErrorMessage(error: string): string {
  switch (error) {
    case "Task ID is required":
    case "User ID is required":
      return "מזהה משתמש חסר";
    case "Task not found":
      return "המטלה לא נמצאה";
    case "User is not assigned to this task":
      return "אין לך הרשאה לצפות במטלה זו";
    case "Task data is invalid":
      return "נתוני המטלה לא תקינים";
    case "Get task failed":
      return "טעינת המטלה נכשלה";
    case "Task already completed":
      return "המטלה כבר סומנה כבוצעה";
    case "Complete task failed":
      return "סימון המטלה נכשל";
    default:
      return error;
  }
}

export default function TaskPage() {
  const router = useRouter();
  const taskId = typeof router.query.taskId === "string" ? router.query.taskId : "";

  const [user, setUser] = useState<PublicUser | null>(null);
  const [task, setTask] = useState<PublicTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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
          setErrorMessage(getErrorMessage(error ?? "טעינת המטלה נכשלה"));
          return;
        }

        setTask((data as GetTaskSuccessResponse).task);
      } catch {
        setErrorMessage("שגיאה בטעינת המטלה. נסה שוב.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTask();
  }, [user, taskId, router.isReady]);

  const handleCompleteTask = async () => {
    if (!user || !task) {
      return;
    }

    setIsCompleting(true);
    setIsConfirmOpen(false);
    setErrorMessage(null);

    try {
      const { response, data } = await completeTask(task.id, {
        userId: user.id,
      });

      if (!response.ok) {
        const { error } = data as CompleteTaskErrorResponse;
        setErrorMessage(getErrorMessage(error ?? "סימון המטלה נכשל"));
        return;
      }

      await router.replace("/home");
    } catch {
      setErrorMessage("שגיאה בסימון המטלה. נסה שוב.");
    } finally {
      setIsCompleting(false);
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
        <title>{task ? `${task.title} | תגביה` : "מטלה | תגביה"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout user={user}>
        <Container maxWidth="sm" sx={{ py: 3 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : !task ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            לא ניתן לטעון את המטלה
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h5" component="h1">
              {task.title}
            </Typography>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                מאת {task.creatorRank} {task.creatorName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getRoleLabel(task.creatorRole)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">
                  תג"ב: {formatDueDate(task.dueDate)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDaysLeft(task.dueDate)}
                </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                תוכן
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {task.content}
              </Typography>
            </Box>
            <Button
              variant="contained"
              disabled={isCompleting}
              onClick={() => setIsConfirmOpen(true)}
              startIcon={
                isCompleting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CheckIcon />
                )
              }
            >
              {isCompleting ? "מסמן..." : "בוצע"}
            </Button>
          </Box>
        )}
      </Container>
      </AppLayout>
      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>סימון מטלה כבוצעה</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך לסמן את &quot;{task?.title}&quot; כבוצעה?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsConfirmOpen(false)}>ביטול</Button>
          <Button variant="contained" onClick={() => void handleCompleteTask()}>
            אישור
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
