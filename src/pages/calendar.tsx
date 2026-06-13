import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Snackbar } from "@mui/material";
import AppLayout from "@/components/AppLayout";
import { APP_BOTTOM_BAR_HEIGHT } from "@/components/AppBottomBar";
import MonthCalendar from "@/components/MonthCalendar";
import { getSession } from "@/lib/authStorage";
import { fetchCalendarReminders } from "@/lib/fetchCalendarReminders";
import { fetchCalendarTasks } from "@/lib/fetchCalendarTasks";
import type { PublicCalendarReminder } from "@/types/calendarReminder";
import type { CalendarTask } from "@/types/task";
import type { PublicUser } from "@/types/user";

function getErrorMessage(error: string): string {
  switch (error) {
    case "User ID is required":
      return "מזהה משתמש חסר";
    case "Creator ID is required":
      return "מזהה יוצר חסר";
    case "List tasks failed":
      return "טעינת המטלות נכשלה";
    case "List calendar reminders failed":
      return "טעינת התזכורות נכשלה";
    default:
      return error;
  }
}

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [reminders, setReminders] = useState<PublicCalendarReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

    const loadCalendarData = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [tasksResult, remindersResult] = await Promise.all([
          fetchCalendarTasks(user),
          fetchCalendarReminders(),
        ]);

        if (!tasksResult.response.ok) {
          setErrorMessage(
            getErrorMessage(tasksResult.error ?? "טעינת המטלות נכשלה"),
          );
          return;
        }

        if (!remindersResult.response.ok) {
          setErrorMessage(
            getErrorMessage(
              remindersResult.error ?? "טעינת התזכורות נכשלה",
            ),
          );
          return;
        }

        setTasks(tasksResult.tasks);
        setReminders(remindersResult.reminders);
      } catch {
        setErrorMessage("שגיאה בטעינת לוח השנה. נסה שוב.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCalendarData();
  }, [user]);

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
        <title>לוח שנה | תגביה</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout user={user}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: `calc(100dvh - ${APP_BOTTOM_BAR_HEIGHT + 88}px)`,
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
          <MonthCalendar tasks={tasks} reminders={reminders} />
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
