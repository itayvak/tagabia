import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import { appBottomOffset } from "@/components/AppBottomBar";
import UserEditDialog, { type UserEditMode } from "@/components/UserEditDialog";
import { canAccessAdmin } from "@/lib/admin";
import { getSession } from "@/lib/authStorage";
import { fetchAdminUsers } from "@/lib/fetchAdminUsers";
import { formatPlatoonLabel } from "@/lib/platoons";
import { getRoleLabel } from "@/lib/roles";
import type {
  AdminUserListItem,
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
    case "List users failed":
      return "טעינת רשימת המשתמשים נכשלה";
    default:
      return error;
  }
}

function userMatchesQuery(user: AdminUserListItem, query: string): boolean {
  const haystack = [
    user.id,
    user.fullname,
    user.rank,
    user.role,
    getRoleLabel(user.role),
    user.platoon,
    formatPlatoonLabel(user.platoon),
    String(user.team),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<UserEditMode>("edit");
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(
    null,
  );

  const loadUsers = useCallback(async (adminUserId: string) => {
    setIsLoading(true);
    setErrorMessage(null);

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
      setIsLoading(false);
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

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((entry) => userMatchesQuery(entry, query));
  }, [users, searchQuery]);

  const handleOpenCreate = () => {
    setDialogMode("create");
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (entry: AdminUserListItem) => {
    setDialogMode("edit");
    setSelectedUser(entry);
    setDialogOpen(true);
  };

  const handleUserSaved = async () => {
    if (!user) {
      return;
    }

    await loadUsers(user.id);
    setSuccessMessage(
      dialogMode === "create" ? "המשתמש נוצר בהצלחה" : "המשתמש עודכן בהצלחה",
    );
  };

  const handleUserDeleted = async () => {
    if (!user) {
      return;
    }

    await loadUsers(user.id);
    setSuccessMessage("המשתמש נמחק");
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
            pb: appBottomOffset(24),
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                component={Link}
                href="/admin"
                startIcon={<ArrowBackIcon />}
                size="small"
              >
                חזרה
              </Button>
              <Typography variant="h6">ניהול משתמשים</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              disabled={isLoading}
            >
              הוסף משתמש
            </Button>
          </Box>

          <TextField
            fullWidth
            placeholder="חיפוש לפי שם, מזהה, דרגה, פלוגה או צוות"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              {searchQuery.trim()
                ? "לא נמצאו משתמשים התואמים לחיפוש"
                : "אין משתמשים"}
            </Typography>
          ) : (
            <List disablePadding>
              {filteredUsers.map((entry) => (
                <ListItemButton
                  key={entry.id}
                  onClick={() => handleOpenEdit(entry)}
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
                    {entry.requestedPasswordReset && (
                      <Chip
                        label="ביקש/ה איפוס סיסמה"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </ListItemButton>
              ))}
            </List>
          )}
        </Container>

        <UserEditDialog
          open={dialogOpen}
          mode={dialogMode}
          adminUserId={user.id}
          user={selectedUser}
          onClose={() => setDialogOpen(false)}
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
