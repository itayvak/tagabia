import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import { getSession } from "@/lib/authStorage";
import { fetchPersonalTodos } from "@/lib/fetchPersonalTodos";
import { savePersonalTodos } from "@/lib/savePersonalTodos";
import type { PersonalTodoItem, PublicUser } from "@/types/user";

function getErrorMessage(error: string): string {
  switch (error) {
    case "User ID is required":
      return "מזהה משתמש חסר";
    case "User not found":
      return "המשתמש לא נמצא";
    case "Get personal todos failed":
      return "טעינת הרשימה נכשלה";
    case "Save personal todos failed":
      return "שמירת הרשימה נכשלה";
    case "Todo text is required":
      return "יש להזין טקסט לפריט";
    case "Too many todos (max 100)":
      return "הגעת למקסימום של 100 פריטים";
    default:
      return error;
  }
}

export default function TodoPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [todos, setTodos] = useState<PersonalTodoItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

    const loadTodos = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { response, data } = await fetchPersonalTodos(user.id);

        if (!response.ok) {
          setErrorMessage(
            getErrorMessage("error" in data ? data.error : "Get personal todos failed"),
          );
          return;
        }

        if ("todos" in data) {
          setTodos(data.todos);
        }
      } catch {
        setErrorMessage(getErrorMessage("Get personal todos failed"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadTodos();
  }, [user]);

  const persistTodos = useCallback(
    async (updatedTodos: PersonalTodoItem[]) => {
      if (!user) {
        return false;
      }

      setIsSaving(true);
      setErrorMessage(null);

      try {
        const { response, data } = await savePersonalTodos(user.id, updatedTodos);

        if (!response.ok) {
          setErrorMessage(
            getErrorMessage("error" in data ? data.error : "Save personal todos failed"),
          );
          return false;
        }

        if ("todos" in data) {
          setTodos(data.todos);
        }

        return true;
      } catch {
        setErrorMessage(getErrorMessage("Save personal todos failed"));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user],
  );

  const handleAddItem = async () => {
    const text = newItemText.trim();
    if (!text || isSaving) {
      return;
    }

    const newItem: PersonalTodoItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const previousTodos = todos;
    const updatedTodos = [...todos, newItem];
    setTodos(updatedTodos);
    setNewItemText("");

    const saved = await persistTodos(updatedTodos);
    if (!saved) {
      setTodos(previousTodos);
    }
  };

  const handleToggleComplete = async (id: string) => {
    if (isSaving) {
      return;
    }

    const previousTodos = todos;
    const updatedTodos = todos.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    setTodos(updatedTodos);

    const saved = await persistTodos(updatedTodos);
    if (!saved) {
      setTodos(previousTodos);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (isSaving) {
      return;
    }

    const previousTodos = todos;
    const updatedTodos = todos.filter((item) => item.id !== id);
    setTodos(updatedTodos);

    const saved = await persistTodos(updatedTodos);
    if (!saved) {
      setTodos(previousTodos);
    }
  };

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>רשימה אישית | תג&quot;בייה</title>
      </Head>
      <AppLayout user={user}>
        <Container maxWidth="sm" sx={{ py: 3 }}>
          <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
            רשימה אישית
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="הוסף פריט חדש..."
              value={newItemText}
              onChange={(event) => setNewItemText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleAddItem();
                }
              }}
              disabled={isSaving}
            />
            <IconButton
              color="primary"
              aria-label="הוסף פריט"
              onClick={() => void handleAddItem()}
              disabled={!newItemText.trim() || isSaving}
            >
              <AddIcon />
            </IconButton>
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : todos.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              אין פריטים ברשימה
            </Typography>
          ) : (
            <List disablePadding>
              {todos.map((item) => (
                <ListItem
                  key={item.id}
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="מחק פריט"
                      onClick={() => void handleDeleteItem(item.id)}
                      disabled={isSaving}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    onClick={() => void handleToggleComplete(item.id)}
                    disabled={isSaving}
                    dense
                  >
                    <ListItemIcon sx={{ minWidth: 42 }}>
                      <Checkbox
                        edge="start"
                        checked={item.completed}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      slotProps={{
                        primary: {
                          sx: item.completed
                            ? { textDecoration: "line-through", color: "text.secondary" }
                            : undefined,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Container>
      </AppLayout>

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
