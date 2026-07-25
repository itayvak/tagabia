import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Snackbar } from "@mui/material";
import AppLayout from "@/components/AppLayout";
import {
  APP_BOTTOM_BAR_HEIGHT,
  APP_BOTTOM_BAR_SAFE_AREA,
} from "@/components/AppBottomBar";
import MonthCalendar from "@/components/MonthCalendar";
import { getSession } from "@/lib/authStorage";
import { fetchCalendarTasks } from "@/lib/fetchCalendarTasks";
import { fetchCourseConfig } from "@/lib/fetchCourseConfig";
import { completeTask } from "@/lib/completeTask";
import { triggerTaskConfetti } from "@/lib/taskConfetti";
import type {
  GetCourseConfigSuccessResponse,
  PublicCourseConfig,
} from "@/types/courseConfig";
import type {
  CalendarTask,
  CompleteTaskErrorResponse,
  CompleteTaskSuccessResponse,
} from "@/types/task";
import type { PublicUser } from "@/types/user";

function getErrorMessage(error: string): string {
  switch (error) {
    case "User ID is required":
      return "מזהה משתמש חסר";
    case "Creator ID is required":
      return "מזהה יוצר חסר";
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

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [courseConfig, setCourseConfig] = useState<PublicCourseConfig | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
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
    const loadCourseConfig = async () => {
      try {
        const { response, data } = await fetchCourseConfig();

        if (!response.ok) {
          return;
        }

        setCourseConfig((data as GetCourseConfigSuccessResponse).config);
      } catch {
        // Keep week labels hidden when config cannot be loaded.
      }
    };

    void loadCourseConfig();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadCalendarData = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const tasksResult = await fetchCalendarTasks(user);

        if (!tasksResult.response.ok) {
          setErrorMessage(
            getErrorMessage(tasksResult.error ?? "טעינת המטלות נכשלה"),
          );
          return;
        }

        setTasks(tasksResult.tasks);
      } catch {
        setErrorMessage("שגיאה בטעינת לוח השנה. נסה שוב.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCalendarData();
  }, [user]);

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

  return (
    <>
      <AppLayout user={user}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: `calc(100dvh - ${APP_BOTTOM_BAR_HEIGHT + 88}px - ${APP_BOTTOM_BAR_SAFE_AREA})`,
            position: "relative",
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                inset: 0,
                justifyContent: "center",
                position: "absolute",
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          ) : null}
          <MonthCalendar
            tasks={tasks}
            courseConfig={courseConfig}
            completingTaskId={completingTaskId}
            onCompleteTask={(taskId) => void handleCompleteTask(taskId)}
          />
        </Box>
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
