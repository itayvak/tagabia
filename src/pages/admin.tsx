import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Snackbar,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import { isAdminUser } from "@/lib/admin";
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

export default function AdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      void router.replace("/");
      return;
    }

    if (!isAdminUser(session.user.id)) {
      void router.replace("/home");
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
        <title>ניהול | תגביה</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout user={user}>
        <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            onClick={() => void handleDownloadUsers()}
            disabled={isDownloading || isUploading}
          >
            {isDownloading ? "מוריד..." : "הורד רשימת משתמשים"}
          </Button>
          <Button
            variant="outlined"
            onClick={handleUploadClick}
            disabled={isDownloading || isUploading}
          >
            {isUploading ? "מעלה..." : "העלה רשימת משתמשים"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => void handleFileSelected(event)}
          />
        </Box>
      </Container>
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
