import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import ShareIcon from "@mui/icons-material/Share";
import AppLayout from "@/components/AppLayout";
import { APP_BOTTOM_BAR_HEIGHT } from "@/components/AppBottomBar";
import LinkifiedText from "@/components/LinkifiedText";
import TaskFormRenderer from "@/components/TaskFormRenderer";
import TaskMediaAttachments from "@/components/TaskMediaAttachments";
import { getSession } from "@/lib/authStorage";
import { completeTask } from "@/lib/completeTask";
import { fetchTask } from "@/lib/fetchTask";
import { triggerTaskConfetti } from "@/lib/taskConfetti";
import { isUserAssignedToTask } from "@/lib/assigneeTeams";
import { getRoleLabel } from "@/lib/roles";
import { formatDaysLeft, formatDueDate } from "@/lib/taskDate";
import { shareTaskAsImage } from "@/lib/shareTaskAsImage";
import { areRequiredFormAnswersFilled } from "@/lib/taskFormValidation";
import type {
  AssignedTask,
  CompleteTaskErrorResponse,
  GetTaskErrorResponse,
  GetTaskSuccessResponse,
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
    case "Form answers are required":
      return "יש למלא את הטופס לפני סימון המטלה כבוצעה";
    default:
      if (error.startsWith("Required form field is missing:")) {
        return "יש למלא את כל שדות החובה בטופס";
      }
      if (error.startsWith("Invalid option for form field:")) {
        return "נבחרה אפשרות לא תקינה בשדה בטופס";
      }
      return error;
  }
}

export default function TaskPage() {
  const router = useRouter();
  const taskId = typeof router.query.taskId === "string" ? router.query.taskId : "";

  const [user, setUser] = useState<PublicUser | null>(null);
  const [task, setTask] = useState<AssignedTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const formFields = task?.formFields ?? [];
  const hasFormFields = formFields.length > 0;
  const canCompleteForm =
    !hasFormFields || areRequiredFormAnswersFilled(formFields, answers);

  const isAssignee =
    !user || !task
      ? false
      : isUserAssignedToTask(
          user.id,
          user.team,
          task.assignedTeams,
          task.assignedUsers,
        );

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
        const loadedTask = (data as GetTaskSuccessResponse).task;
        setAnswers(loadedTask.submission?.answers ?? {});
      } catch {
        setErrorMessage("שגיאה בטעינת המטלה. נסה שוב.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTask();
  }, [user, taskId, router.isReady]);

  const handleCompleteTask = async () => {
    if (!user || !task || task.completed || !isAssignee) {
      return;
    }

    setIsCompleting(true);
    setIsConfirmOpen(false);
    setErrorMessage(null);

    try {
      const { response, data } = await completeTask(task.id, {
        userId: user.id,
        answers: hasFormFields ? answers : undefined,
      });

      if (!response.ok) {
        const { error } = data as CompleteTaskErrorResponse;
        setErrorMessage(getErrorMessage(error ?? "סימון המטלה נכשל"));
        return;
      }

      void triggerTaskConfetti();
      await router.replace("/home");
    } catch {
      setErrorMessage("שגיאה בסימון המטלה. נסה שוב.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleShareTask = async () => {
    if (!task || !user) {
      return;
    }

    setIsSharing(true);
    setErrorMessage(null);

    try {
      const result = await shareTaskAsImage(task, user.id);
      if (result === "downloaded") {
        setSuccessMessage("התמונה הורדה למכשיר");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setErrorMessage("שגיאה בשיתוף המטלה");
    } finally {
      setIsSharing(false);
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
        <Box
          sx={{
            bgcolor: "grey.200",
            py: 3,
            flex: 1,
            minHeight: `calc(100dvh - ${APP_BOTTOM_BAR_HEIGHT + 88}px)`,
          }}
        >
          <Container maxWidth="sm">
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
              <Button
                endIcon={<ArrowBackIcon />}
                onClick={() => void router.back()}
                sx={{ color: "text.secondary" }}
              >
                חזור
              </Button>
            </Box>
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
                <Card elevation={0} sx={{ borderRadius: 2 }}>
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      "&:last-child": { pb: 2 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Typography variant="h5" component="h1" sx={{ flex: 1 }}>
                        {task.title}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={isSharing}
                        onClick={() => void handleShareTask()}
                        startIcon={
                          isSharing ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <ShareIcon />
                          )
                        }
                        sx={{ flexShrink: 0 }}
                      >
                        {isSharing ? "משתף..." : "שיתוף"}
                      </Button>
                    </Box>
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
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                    <Typography variant="subtitle2" gutterBottom>
                      תוכן
                    </Typography>
                    <LinkifiedText text={task.content} />
                    <TaskMediaAttachments media={task.media} />
                  </CardContent>
                </Card>

                {hasFormFields ? (
                  <Card elevation={0} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                      <Typography variant="subtitle2" gutterBottom>
                        טופס
                      </Typography>
                      <TaskFormRenderer
                        fields={formFields}
                        answers={answers}
                        onChange={(fieldId, value) =>
                          setAnswers((current) => ({
                            ...current,
                            [fieldId]: value,
                          }))
                        }
                        disabled={task.completed || !isAssignee}
                      />
                    </CardContent>
                  </Card>
                ) : null}

                <Button
                  variant="contained"
                  fullWidth
                  disabled={
                    isCompleting ||
                    task.completed ||
                    !isAssignee ||
                    (hasFormFields && !canCompleteForm)
                  }
                  onClick={() => {
                    if (!isAssignee) return;
                    setIsConfirmOpen(true);
                  }}
                  startIcon={
                    isCompleting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : isAssignee && !task.completed ? (
                      <CheckIcon />
                    ) : (
                      undefined
                    )
                  }
                >
                  {isCompleting
                    ? "מסמן..."
                    : task.completed
                      ? "סומן כבוצע"
                      : isAssignee
                        ? "בוצע"
                        : "אינך משויך למטלה זו"}
                </Button>
              </Box>
            )}
          </Container>
        </Box>
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
