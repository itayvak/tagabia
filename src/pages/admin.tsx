import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DownloadIcon from "@mui/icons-material/Download";
import PeopleIcon from "@mui/icons-material/People";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import { APP_BOTTOM_BAR_HEIGHT } from "@/components/AppBottomBar";
import CourseWeeksDialog from "@/components/CourseWeeksDialog";
import { canAccessAdmin } from "@/lib/admin";
import { getSession } from "@/lib/authStorage";
import { downloadUsersCsv } from "@/lib/downloadUsersCsv";
import { uploadUsersCsv } from "@/lib/uploadUsersCsv";
import type {
  ImportUsersErrorResponse,
  ImportUsersSuccessResponse,
  PublicUser,
} from "@/types/user";

function getErrorMessage(error: string): string {
  switch (error) {
    case "User ID is required":
      return "מזהה משתמש חסר";
    case "Forbidden":
      return "אין לך הרשאה לפעולה זו";
    case "Export users failed":
      return "הורדת רשימת המשתמשים נכשלה";
    case "CSV content is required":
      return "לא נבחר קובץ";
    case "CSV file is empty":
      return "קובץ ה-CSV ריק";
    case "Invalid CSV headers":
      return "כותרות הקובץ אינן תקינות";
    case "Import users failed":
      return "העלאת רשימת המשתמשים נכשלה";
    case "Get course config failed":
      return "טעינת הגדרות הקורס נכשלה";
    case "Update course config failed":
      return "שמירת הגדרות הקורס נכשלה";
    case "Start date is required":
      return "יש לבחור תאריך התחלה";
    case "At least one week is required":
      return "יש להוסיף לפחות שבוע אחד";
    default:
      return error.startsWith("Row ")
        ? `שגיאה בקובץ: ${error}`
        : error;
  }
}

function getSuccessMessage(result: ImportUsersSuccessResponse): string {
  const parts: string[] = [];

  if (result.created > 0) {
    parts.push(`${result.created} נוצרו`);
  }

  if (result.updated > 0) {
    parts.push(`${result.updated} עודכנו`);
  }

  if (result.unchanged > 0) {
    parts.push(`${result.unchanged} ללא שינוי`);
  }

  if (result.deleted > 0) {
    parts.push(`${result.deleted} נמחקו`);
  }

  return parts.length > 0 ? `סנכרון הושלם: ${parts.join(", ")}` : "לא נמצאו שינויים";
}

function AdminSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCourseWeeksDialogOpen, setIsCourseWeeksDialogOpen] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      void router.replace("/");
      return;
    }

    if (!canAccessAdmin(session.user)) {
      void router.replace("/allTasks");
      return;
    }

    setUser(session.user);
  }, [router]);

  const handleDownloadUsers = async () => {
    if (!user) {
      return;
    }

    setIsDownloading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await downloadUsersCsv(user.id);

      if (!result.ok) {
        setErrorMessage(getErrorMessage(result.error));
      }
    } catch {
      setErrorMessage(getErrorMessage("Export users failed"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !user) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const csv = await file.text();
      const { response, data } = await uploadUsersCsv(user.id, csv);

      if (!response.ok) {
        const { error } = data as ImportUsersErrorResponse;
        setErrorMessage(getErrorMessage(error ?? "Import users failed"));
        return;
      }

      setSuccessMessage(
        getSuccessMessage(data as ImportUsersSuccessResponse),
      );
    } catch {
      setErrorMessage(getErrorMessage("Import users failed"));
    } finally {
      setIsUploading(false);
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
        <Container
          maxWidth="md"
          sx={{
            py: 3,
            pb: `${APP_BOTTOM_BAR_HEIGHT + 24}px`,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
              מפתחים
            </Typography>
            <Typography variant="body2" color="text.secondary">
              הגדרות מערכת, ניהול משתמשים וקורס
            </Typography>
          </Box>

          <AdminSection icon={<PeopleIcon />} title="משתמשים">
            <Button
              variant="contained"
              component={Link}
              href="/admin/users"
              disabled={isDownloading || isUploading}
              fullWidth
            >
              ניהול משתמשים
            </Button>

            <Divider />

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                ייבוא וייצוא מרוכז
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => void handleDownloadUsers()}
                  disabled={isDownloading || isUploading}
                  sx={{ flex: { xs: "1 1 100%", sm: "1 1 auto" } }}
                >
                  {isDownloading ? "מוריד..." : "הורד CSV"}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={handleUploadClick}
                  disabled={isDownloading || isUploading}
                  sx={{ flex: { xs: "1 1 100%", sm: "1 1 auto" } }}
                >
                  {isUploading ? "מעלה..." : "העלה CSV"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(event) => void handleFileSelected(event)}
                />
              </Box>
            </Box>
          </AdminSection>

          <AdminSection icon={<CalendarMonthIcon />} title="הגדרות קורס">
            <Button
              variant="contained"
              onClick={() => setIsCourseWeeksDialogOpen(true)}
              disabled={isDownloading || isUploading}
              fullWidth
            >
              עריכת שבועות הקורס
            </Button>
          </AdminSection>
        </Container>
        <CourseWeeksDialog
          open={isCourseWeeksDialogOpen}
          userId={user.id}
          onClose={() => setIsCourseWeeksDialogOpen(false)}
          onSaved={() => setSuccessMessage("הגדרות הקורס נשמרו")}
          onError={(message) => setErrorMessage(message)}
        />
      </AppLayout>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={5000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={5000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
