import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DownloadIcon from "@mui/icons-material/Download";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PeopleIcon from "@mui/icons-material/People";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import { APP_BOTTOM_BAR_HEIGHT } from "@/components/AppBottomBar";
import CourseWeeksDialog from "@/components/CourseWeeksDialog";
import UserEditDialog from "@/components/UserEditDialog";
import { canAccessAdmin } from "@/lib/admin";
import { getSession } from "@/lib/authStorage";
import { downloadUsersCsv } from "@/lib/downloadUsersCsv";
import { fetchAdminUsers } from "@/lib/fetchAdminUsers";
import { formatPlatoonLabel } from "@/lib/platoons";
import { getRoleLabel } from "@/lib/roles";
import { uploadUsersCsv } from "@/lib/uploadUsersCsv";
import type {
  AdminUserListItem,
  ImportUsersErrorResponse,
  ImportUsersSuccessResponse,
  ListAdminUsersErrorResponse,
  ListAdminUsersSuccessResponse,
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
    case "List users failed":
      return "טעינת רשימת המשתמשים נכשלה";
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
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(
    null,
  );

  const loadUsers = useCallback(async (adminUserId: string) => {
    setIsLoadingUsers(true);

    try {
      const { response, data } = await fetchAdminUsers(adminUserId);

      if (!response.ok) {
        const { error } = data as ListAdminUsersErrorResponse;
        setErrorMessage(getErrorMessage(error ?? "List users failed"));
        return;
      }

      setUsers((data as ListAdminUsersSuccessResponse).users);
    } catch {
      setErrorMessage(getErrorMessage("List users failed"));
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

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
    void loadUsers(session.user.id);
  }, [router, loadUsers]);

  const pendingPasswordResetUsers = useMemo(
    () => users.filter((entry) => entry.requestedPasswordReset),
    [users],
  );

  const handleOpenUserEdit = (entry: AdminUserListItem) => {
    setSelectedUser(entry);
    setEditDialogOpen(true);
  };

  const handleUserSaved = async () => {
    if (!user) {
      return;
    }

    await loadUsers(user.id);
    setSuccessMessage("המשתמש עודכן בהצלחה");
  };

  const handleUserDeleted = async () => {
    if (!user) {
      return;
    }

    await loadUsers(user.id);
    setSuccessMessage("המשתמש נמחק");
  };

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

          <AdminSection
            icon={<NotificationsActiveIcon />}
            title="התראות מפתחים"
          >
            {isLoadingUsers ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : pendingPasswordResetUsers.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 1 }}>
                אין התראות
              </Typography>
            ) : (
              <List disablePadding>
                {pendingPasswordResetUsers.map((entry) => (
                  <ListItemButton
                    key={entry.id}
                    onClick={() => handleOpenUserEdit(entry)}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={`${entry.rank} ${entry.fullname}`}
                      secondary={`${formatPlatoonLabel(entry.platoon)} · צוות ${entry.team} · ${getRoleLabel(entry.role)} · ${entry.id}`}
                    />
                    <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                      {entry.needsPasswordSetup && (
                        <Chip
                          label="ממתין לסיסמה"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      <Chip
                        label="ביקש/ה איפוס סיסמה"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </Box>
                  </ListItemButton>
                ))}
              </List>
            )}
          </AdminSection>

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
        <UserEditDialog
          open={editDialogOpen}
          mode="edit"
          adminUserId={user.id}
          user={selectedUser}
          onClose={() => setEditDialogOpen(false)}
          onSaved={handleUserSaved}
          onDeleted={handleUserDeleted}
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
