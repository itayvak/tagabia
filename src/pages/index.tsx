import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { clearSession, getSession, saveSession } from "@/lib/authStorage";
import { isLoginNeedsPasswordSetup, loginWithCredentials } from "@/lib/login";
import { setPassword as setUserPassword } from "@/lib/setPassword";
import type {
  LoginErrorResponse,
  LoginSuccessResponse,
  SetPasswordErrorResponse,
  SetPasswordSuccessResponse,
} from "@/types/user";

function getErrorMessage(error: string): string {
  switch (error) {
    case "Invalid credentials":
      return "פרטי התחברות שגויים";
    case "ID is required":
      return "יש להזין תעודת זהות";
    case "ID and password are required":
      return "יש להזין תעודת זהות וסיסמה";
    case "Login failed":
      return "ההתחברות נכשלה";
    case "Password is required":
      return "יש לבחור סיסמה";
    case "Password already set":
      return "לחשבון כבר יש סיסמה";
    case "User not found":
      return "המשתמש לא נמצא";
    case "Set password failed":
      return "שמירת הסיסמה נכשלה";
    default:
      return error;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupUserId, setSetupUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setIsCheckingSession(false);
      return;
    }

    const autoLogin = async () => {
      setIsSubmitting(true);

      try {
        const { response, data } = await loginWithCredentials(
          session.credentials.id,
          session.credentials.password,
        );

        if (!response.ok) {
          clearSession();
          setIsCheckingSession(false);
          setIsSubmitting(false);
          return;
        }

        saveSession(
          (data as LoginSuccessResponse).user,
          session.credentials,
        );
        await router.replace("/allTasks");
      } catch {
        clearSession();
        setIsCheckingSession(false);
        setIsSubmitting(false);
      }
    };

    void autoLogin();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { response, data } = await loginWithCredentials(id, password);

      if (isLoginNeedsPasswordSetup(data)) {
        setSetupUserId(data.userId);
        setNewPassword("");
        setConfirmPassword("");
        return;
      }

      if (!response.ok) {
        const { error } = data as LoginErrorResponse;
        setErrorMessage(getErrorMessage(error ?? "ההתחברות נכשלה"));
        return;
      }

      saveSession((data as LoginSuccessResponse).user, {
        id: id.trim(),
        password,
      });
      await router.replace("/allTasks");
    } catch {
      setErrorMessage("שגיאה בהתחברות. נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!setupUserId) {
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("הסיסמאות אינן תואמות");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { response, data } = await setUserPassword(setupUserId, newPassword);

      if (!response.ok) {
        const { error } = data as SetPasswordErrorResponse;
        setErrorMessage(getErrorMessage(error ?? "שמירת הסיסמה נכשלה"));
        return;
      }

      saveSession((data as SetPasswordSuccessResponse).user, {
        id: setupUserId,
        password: newPassword,
      });
      await router.replace("/allTasks");
    } catch {
      setErrorMessage("שגיאה בשמירת הסיסמה. נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setSetupUserId(null);
    setNewPassword("");
    setConfirmPassword("");
    setErrorMessage(null);
  };

  if (isCheckingSession) {
    return (
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
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
      </>
    );
  }

  return (
    <>
      <Head>
        <meta name="description" content="התחברות לתגביה" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, #e8eef6 0%, #f4f6f9 45%, #eef2f8 100%)",
          px: 2,
          py: 4,
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              width: "100%",
              border: 1,
              borderColor: "divider",
              boxShadow: "0 12px 40px rgba(21, 101, 192, 0.08)",
            }}
          >
            <Typography
              variant="h5"
              component="h1"
              gutterBottom
              align="center"
              sx={{ mb: 0.5, fontSize: "calc(1.5rem + 10px)", fontWeight: "bold" }}
            >
              All In One
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mb: 3 }}
            >
              {setupUserId ? "הגדרת סיסמה" : "התחברות"}
            </Typography>
            {setupUserId ? (
              <Box
                component="form"
                onSubmit={handleSetPassword}
                sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
              >
                <Typography variant="body2" color="text.secondary" align="center">
                  זוהי התחברות ראשונה. יש לבחור סיסמה לחשבון.
                </Typography>
                <TextField
                  label="סיסמה חדשה"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  fullWidth
                  autoComplete="new-password"
                  autoFocus
                  disabled={isSubmitting}
                  slotProps={{
                    htmlInput: { dir: "rtl" },
                  }}
                />
                <TextField
                  label="אישור סיסמה"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  fullWidth
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  slotProps={{
                    htmlInput: { dir: "rtl" },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : undefined
                  }
                >
                  {isSubmitting ? "שומר..." : "שמור והתחבר"}
                </Button>
                <Button
                  type="button"
                  variant="text"
                  onClick={handleBackToLogin}
                  disabled={isSubmitting}
                >
                  חזרה להתחברות
                </Button>
              </Box>
            ) : (
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
              >
                <TextField
                  label="תעודת זהות"
                  value={id}
                  onChange={(event) => setId(event.target.value)}
                  required
                  fullWidth
                  autoComplete="username"
                  type="number"
                  autoFocus
                  disabled={isSubmitting}
                  slotProps={{
                    htmlInput: { dir: "rtl" },
                  }}
                />
                <TextField
                  label="סיסמה"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  fullWidth
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  helperText="השאר ריק אם זו התחברות ראשונה"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                            onClick={() => setShowPassword((prev) => !prev)}
                            onMouseDown={(event) => event.preventDefault()}
                            edge="end"
                            disabled={isSubmitting}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                    htmlInput: { dir: "rtl" },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : undefined
                  }
                >
                  {isSubmitting ? "מתחבר..." : "התחבר"}
                </Button>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
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
