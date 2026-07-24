import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { isAdminUser } from "@/lib/admin";
import { createAdminUser } from "@/lib/createAdminUser";
import { deleteAdminUser } from "@/lib/deleteAdminUser";
import {
  formatPlatoonLabel,
  getTeamsForPlatoon,
  PLATOONS,
} from "@/lib/platoons";
import { ROLE_LABELS, ROLE_LIST } from "@/lib/roles";
import { updateAdminUser } from "@/lib/updateAdminUser";
import type {
  AdminUserListItem,
  CreateAdminUserErrorResponse,
  CreateAdminUserSuccessResponse,
  DeleteAdminUserErrorResponse,
  Platoon,
  Role,
  UpdateAdminUserErrorResponse,
  UpdateAdminUserSuccessResponse,
} from "@/types/user";

export type UserEditMode = "create" | "edit";

interface UserEditDialogProps {
  open: boolean;
  mode: UserEditMode;
  adminUserId: string;
  user: AdminUserListItem | null;
  onClose: () => void;
  onSaved: (user: AdminUserListItem) => void;
  onDeleted: (userId: string) => void;
  onError: (message: string) => void;
}

function getErrorMessage(error: string): string {
  switch (error) {
    case "User ID is required":
      return "מזהה משתמש חסר";
    case "Forbidden":
      return "אין לך הרשאה לפעולה זו";
    case "User data is required":
      return "נתוני משתמש חסרים";
    case "User id is required":
      return "יש להזין מזהה משתמש";
    case "User already exists":
      return "משתמש עם מזהה זה כבר קיים";
    case "User not found":
      return "המשתמש לא נמצא";
    case "Cannot delete admin user":
      return "לא ניתן למחוק את משתמש המנהל";
    case "Create user failed":
      return "יצירת המשתמש נכשלה";
    case "Update user failed":
      return "עדכון המשתמש נכשל";
    case "Delete user failed":
      return "מחיקת המשתמש נכשלה";
    default:
      if (error.includes("fullname is required")) {
        return "יש להזין שם מלא";
      }
      if (error.includes("rank is required")) {
        return "יש להזין דרגה";
      }
      if (error.includes("invalid role")) {
        return "תפקיד לא תקין";
      }
      if (error.includes("invalid platoon")) {
        return "פלוגה לא תקינה";
      }
      if (error.includes("invalid team")) {
        return "צוות לא תקין";
      }
      return error;
  }
}

const EMPTY_FORM = {
  id: "",
  fullname: "",
  password: "",
  rank: "",
  role: "peasant" as Role,
  platoon: "A" as Platoon,
  team: 1,
};

export default function UserEditDialog({
  open,
  mode,
  adminUserId,
  user,
  onClose,
  onSaved,
  onDeleted,
  onError,
}: UserEditDialogProps) {
  const [id, setId] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [rank, setRank] = useState("");
  const [role, setRole] = useState<Role>("peasant");
  const [platoon, setPlatoon] = useState<Platoon>("A");
  const [team, setTeam] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isResetPasswordConfirmOpen, setIsResetPasswordConfirmOpen] = useState(false);

  const availableTeams = useMemo(
    () => getTeamsForPlatoon(platoon),
    [platoon],
  );

  const isProtectedAdmin = mode === "edit" && user ? isAdminUser(user.id) : false;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && user) {
      setId(user.id);
      setFullname(user.fullname);
      setPassword("");
      setRank(user.rank);
      setRole(user.role);
      setPlatoon(user.platoon);
      setTeam(user.team);
    } else {
      setId(EMPTY_FORM.id);
      setFullname(EMPTY_FORM.fullname);
      setPassword(EMPTY_FORM.password);
      setRank(EMPTY_FORM.rank);
      setRole(EMPTY_FORM.role);
      setPlatoon(EMPTY_FORM.platoon);
      setTeam(EMPTY_FORM.team);
    }

    setIsDeleteConfirmOpen(false);
  }, [open, mode, user]);

  const handlePlatoonChange = (nextPlatoon: Platoon) => {
    setPlatoon(nextPlatoon);
    const teams = getTeamsForPlatoon(nextPlatoon);
    if (!teams.includes(team)) {
      setTeam(teams[0] ?? 1);
    }
  };

  const handleSave = async () => {
    if (mode === "create" && !id.trim()) {
      onError("יש להזין מזהה משתמש");
      return;
    }

    setIsSaving(true);

    try {
      if (mode === "create") {
        const { response, data } = await createAdminUser(adminUserId, {
          id: id.trim(),
          fullname: fullname.trim(),
          password: password.trim() || undefined,
          rank: rank.trim(),
          role,
          platoon,
          team,
        });

        if (!response.ok) {
          const { error } = data as CreateAdminUserErrorResponse;
          onError(getErrorMessage(error ?? "Create user failed"));
          return;
        }

        onSaved((data as CreateAdminUserSuccessResponse).user);
        onClose();
        return;
      }

      if (!user) {
        return;
      }

      const { response, data } = await updateAdminUser(adminUserId, user.id, {
        fullname: fullname.trim(),
        password: password.trim() || undefined,
        rank: rank.trim(),
        role,
        platoon,
        team,
      });

      if (!response.ok) {
        const { error } = data as UpdateAdminUserErrorResponse;
        onError(getErrorMessage(error ?? "Update user failed"));
        return;
      }

      onSaved((data as UpdateAdminUserSuccessResponse).user);
      onClose();
    } catch {
      onError(
        getErrorMessage(mode === "create" ? "Create user failed" : "Update user failed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;

    setIsResettingPassword(true);
    setIsResetPasswordConfirmOpen(false);

    try {
      const { response, data } = await updateAdminUser(adminUserId, user.id, {
        fullname: user.fullname,
        rank: user.rank,
        role: user.role,
        platoon: user.platoon,
        team: user.team,
        resetPassword: true,
      });

      if (!response.ok) {
        const { error } = data as UpdateAdminUserErrorResponse;
        onError(getErrorMessage(error ?? "Update user failed"));
        return;
      }

      onSaved((data as UpdateAdminUserSuccessResponse).user);
    } catch {
      onError(getErrorMessage("Update user failed"));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      return;
    }

    setIsDeleting(true);

    try {
      const { response, data } = await deleteAdminUser(adminUserId, user.id);

      if (!response.ok) {
        const { error } = data as DeleteAdminUserErrorResponse;
        onError(getErrorMessage(error ?? "Delete user failed"));
        return;
      }

      onDeleted(user.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch {
      onError(getErrorMessage("Delete user failed"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {mode === "create" ? "הוספת משתמש" : "עריכת משתמש"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="מזהה"
              value={id}
              onChange={(event) => setId(event.target.value)}
              fullWidth
              disabled={mode === "edit" || isSaving}
              slotProps={{
                htmlInput: { dir: "ltr" },
              }}
            />
            <TextField
              label="שם מלא"
              value={fullname}
              onChange={(event) => setFullname(event.target.value)}
              fullWidth
              disabled={isSaving}
            />
            {mode === "edit" && user ? (
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    סיסמה
                  </Typography>
                  <Chip
                    label={user.needsPasswordSetup ? "טרם הגדיר/ה סיסמה" : "הגדיר/ה סיסמה"}
                    color={user.needsPasswordSetup ? "warning" : "success"}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                {!user.needsPasswordSetup && (
                  <Chip
                    label="איפוס סיסמה"
                    color="warning"
                    size="small"
                    variant="outlined"
                    onClick={() => setIsResetPasswordConfirmOpen(true)}
                    disabled={isSaving || isDeleting || isResettingPassword}
                    sx={{ cursor: "pointer" }}
                  />
                )}
              </Box>
            ) : (
              <TextField
                label="סיסמה"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                fullWidth
                disabled={isSaving}
                helperText="ריק = הגדרה בכניסה ראשונה"
                slotProps={{
                  htmlInput: { dir: "ltr", autoComplete: "new-password" },
                }}
              />
            )}
            <TextField
              label="דרגה"
              value={rank}
              onChange={(event) => setRank(event.target.value)}
              fullWidth
              disabled={isSaving}
            />
            <TextField
              select
              label="תפקיד"
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              fullWidth
              disabled={isSaving}
            >
              {ROLE_LIST.map((roleOption) => (
                <MenuItem key={roleOption} value={roleOption}>
                  {ROLE_LABELS[roleOption]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="פלוגה"
              value={platoon}
              onChange={(event) =>
                handlePlatoonChange(event.target.value as Platoon)
              }
              fullWidth
              disabled={isSaving}
            >
              {PLATOONS.map((platoonOption) => (
                <MenuItem key={platoonOption} value={platoonOption}>
                  {formatPlatoonLabel(platoonOption)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="צוות"
              value={team}
              onChange={(event) => setTeam(Number(event.target.value))}
              fullWidth
              disabled={isSaving}
            >
              {availableTeams.map((teamOption) => (
                <MenuItem key={teamOption} value={teamOption}>
                  {teamOption}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Box>
            {mode === "edit" && (
              <Button
                color="error"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isSaving || isDeleting || isProtectedAdmin}
              >
                מחק
              </Button>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={onClose} disabled={isSaving || isDeleting}>
              ביטול
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleSave()}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? "שומר..." : "שמור"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isResetPasswordConfirmOpen}
        onClose={() => setIsResetPasswordConfirmOpen(false)}
      >
        <DialogTitle>איפוס סיסמה</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שאתה רוצה לאפס סיסמה?
            <br />
            המשתמש יצטרך להגדיר סיסמה חדשה בכניסה הבאה.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsResetPasswordConfirmOpen(false)}
            disabled={isResettingPassword}
          >
            ביטול
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => void handleResetPassword()}
            disabled={isResettingPassword}
          >
            {isResettingPassword ? "מאפס..." : "אפס סיסמה"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
      >
        <DialogTitle>מחיקת משתמש</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {user
              ? `האם למחוק את ${user.fullname} (${user.id})?`
              : "האם למחוק משתמש זה?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeleteConfirmOpen(false)}
            disabled={isDeleting}
          >
            ביטול
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? "מוחק..." : "מחק"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
