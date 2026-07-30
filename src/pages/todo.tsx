import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Snackbar,
  Typography,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import PersonalTodoList from "@/components/PersonalTodoList";
import { getSession } from "@/lib/authStorage";
import { fetchPersonalTodos } from "@/lib/fetchPersonalTodos";
import { savePersonalTodos } from "@/lib/savePersonalTodos";
import type { PersonalTodoItem, PublicUser } from "@/types/user";

const UNDO_DELETE_MS = 5000;

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
    case "Todo description is too long (max 500)":
      return "התיאור ארוך מדי";
    default:
      return error;
  }
}

export default function TodoPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [todos, setTodos] = useState<PersonalTodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    item: PersonalTodoItem;
    index: number;
    updatedTodos: PersonalTodoItem[];
  } | null>(null);
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

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

  const handleAddItem = async (payload: {
    text: string;
    description?: string;
    dueDate?: string;
  }) => {
    const text = payload.text.trim();
    if (!text || isSaving) {
      return false;
    }

    const newItem: PersonalTodoItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (payload.description) {
      newItem.description = payload.description;
    }

    if (payload.dueDate) {
      newItem.dueDate = payload.dueDate;
    }

    const previousTodos = todos;
    const updatedTodos = [...todos, newItem];
    setTodos(updatedTodos);

    const saved = await persistTodos(updatedTodos);
    if (!saved) {
      setTodos(previousTodos);
    }

    return saved;
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

  const finalizeDelete = useCallback(
    async (updatedTodos: PersonalTodoItem[], deletedItem: PersonalTodoItem) => {
      setPendingDelete(null);

      const saved = await persistTodos(updatedTodos);
      if (!saved) {
        setTodos((current) => {
          const exists = current.some((todo) => todo.id === deletedItem.id);
          return exists ? current : [...current, deletedItem];
        });
      }
    },
    [persistTodos],
  );

  const handleDeleteItem = (id: string) => {
    if (isSaving) {
      return;
    }

    const index = todos.findIndex((item) => item.id === id);
    if (index === -1) {
      return;
    }

    const item = todos[index];
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    setTodos(updatedTodos);
    setPendingDelete({ item, index, updatedTodos });

    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }

    deleteTimeoutRef.current = setTimeout(() => {
      deleteTimeoutRef.current = null;
      void finalizeDelete(updatedTodos, item);
    }, UNDO_DELETE_MS);
  };

  const handleUndoDelete = () => {
    if (!pendingDelete) {
      return;
    }

    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }

    const { item, index } = pendingDelete;
    setPendingDelete(null);

    setTodos((current) => {
      if (current.some((todo) => todo.id === item.id)) {
        return current;
      }

      const next = [...current];
      next.splice(Math.min(index, next.length), 0, item);
      return next;
    });
  };

  const handleEditItem = async (
    id: string,
    updates: { text: string; description?: string; dueDate?: string },
  ) => {
    if (isSaving) {
      return;
    }

    const previousTodos = todos;
    const updatedTodos = todos.map((item) => {
      if (item.id !== id) {
        return item;
      }

      const nextItem: PersonalTodoItem = {
        ...item,
        text: updates.text,
      };

      if (updates.description) {
        nextItem.description = updates.description;
      } else {
        delete nextItem.description;
      }

      if (updates.dueDate) {
        nextItem.dueDate = updates.dueDate;
      } else {
        delete nextItem.dueDate;
      }

      return nextItem;
    });
    setTodos(updatedTodos);

    const saved = await persistTodos(updatedTodos);
    if (!saved) {
      setTodos(previousTodos);
    }
  };

  const handleClearCompleted = async () => {
    if (isSaving) {
      return;
    }

    const previousTodos = todos;
    const updatedTodos = todos.filter((item) => !item.completed);
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
      <AppLayout user={user}>
        <Container maxWidth="sm" sx={{ py: 3 }}>
          <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
            משימות אישיות
          </Typography>

          <PersonalTodoList
            todos={todos}
            isLoading={isLoading}
            isSaving={isSaving}
            onAddItem={(payload) => handleAddItem(payload)}
            onToggleComplete={(id) => void handleToggleComplete(id)}
            onDeleteItem={handleDeleteItem}
            onEditItem={(id, updates) => void handleEditItem(id, updates)}
            onClearCompleted={() => void handleClearCompleted()}
          />
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

      <Snackbar
        open={Boolean(pendingDelete)}
        autoHideDuration={UNDO_DELETE_MS}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message="הפריט נמחק"
        action={
          <Button color="inherit" size="small" onClick={handleUndoDelete}>
            בטל
          </Button>
        }
      />
    </>
  );
}
