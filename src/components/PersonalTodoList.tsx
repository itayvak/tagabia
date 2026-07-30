import { useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import DeleteIcon from "@mui/icons-material/Delete";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Fab,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { APP_BOTTOM_BAR_HEIGHT } from "@/components/AppBottomBar";
import { formatDateOnly, fromDateInputValue, toDateInputValue } from "@/lib/taskDate";
import type { PersonalTodoItem } from "@/types/user";

type TodoFilter = "all" | "active" | "completed";

type TodoCreatePayload = {
  text: string;
  description?: string;
  dueDate?: string;
};

interface PersonalTodoListProps {
  todos: PersonalTodoItem[];
  isLoading: boolean;
  isSaving: boolean;
  onAddItem: (payload: TodoCreatePayload) => Promise<boolean>;
  onToggleComplete: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (id: string, updates: TodoCreatePayload) => void;
  onClearCompleted: () => void;
}

function PersonalTodoEditDialog({
  open,
  item,
  isSaving,
  onClose,
  onSave,
}: {
  open: boolean;
  item: PersonalTodoItem | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (updates: { text: string; description?: string; dueDate?: string }) => void;
}) {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (open && item) {
      setText(item.text);
      setDescription(item.description ?? "");
      setDueDate(item.dueDate ? toDateInputValue(item.dueDate) : "");
    }
  }, [open, item]);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const trimmedDescription = description.trim();
    onSave({
      text: trimmed,
      description: trimmedDescription || undefined,
      dueDate: dueDate ? fromDateInputValue(dueDate) : undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>עריכת משימה</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="כותרת"
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoFocus
            disabled={isSaving}
            slotProps={{
              htmlInput: { dir: "rtl", "aria-label": "כותרת" },
            }}
          />
          <TextField
            fullWidth
            label="תיאור (אופציונלי)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSaving}
            multiline
            minRows={3}
            slotProps={{
              htmlInput: { dir: "rtl", "aria-label": "תיאור" },
            }}
          />
          <TextField
            fullWidth
            label="תאריך יעד (אופציונלי)"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            disabled={isSaving}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { dir: "ltr", "aria-label": "תאריך יעד" },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSaving}>
          ביטול
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!text.trim() || isSaving}>
          שמור
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PersonalTodoCreateSheet({
  open,
  isSaving,
  onClose,
  onCreate,
}: {
  open: boolean;
  isSaving: boolean;
  onClose: () => void;
  onCreate: (payload: TodoCreatePayload) => void | Promise<void>;
}) {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [showDate, setShowDate] = useState(false);

  useEffect(() => {
    if (!open) {
      setText("");
      setDescription("");
      setDueDate("");
      setShowDescription(false);
      setShowDate(false);
    }
  }, [open]);

  const handleCreate = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const trimmedDescription = description.trim();
    void onCreate({
      text: trimmed,
      description: trimmedDescription || undefined,
      dueDate: dueDate ? fromDateInputValue(dueDate) : undefined,
    });
  };

  const descriptionActive = showDescription || Boolean(description.trim());
  const dateActive = showDate || Boolean(dueDate);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "85dvh",
            maxWidth: "sm",
            width: "100%",
            mx: "auto",
            left: 0,
            right: 0,
            pb: "env(safe-area-inset-bottom, 0px)",
          },
        },
      }}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          משימה חדשה
        </Typography>

        <Stack spacing={2}>
          <TextField
            fullWidth
            placeholder="משימה חדשה..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleCreate();
              }
            }}
            autoFocus
            disabled={isSaving}
            slotProps={{
              htmlInput: { dir: "rtl", "aria-label": "משימה חדשה" },
            }}
          />

          <Stack direction="row" spacing={0.5}>
            <Tooltip title="תיאור">
              <IconButton
                aria-label="הוסף תיאור"
                onClick={() => setShowDescription((prev) => !prev)}
                disabled={isSaving}
                color={descriptionActive ? "primary" : "default"}
              >
                <NotesOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="תאריך יעד">
              <IconButton
                aria-label="הוסף תאריך יעד"
                onClick={() => setShowDate((prev) => !prev)}
                disabled={isSaving}
                color={dateActive ? "primary" : "default"}
              >
                <EventOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          {showDescription && (
            <TextField
              fullWidth
              label="תיאור (אופציונלי)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isSaving}
              multiline
              minRows={3}
              slotProps={{
                htmlInput: { dir: "rtl", "aria-label": "תיאור" },
              }}
            />
          )}

          {showDate && (
            <TextField
              fullWidth
              label="תאריך יעד (אופציונלי)"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={isSaving}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { dir: "ltr", "aria-label": "תאריך יעד" },
              }}
            />
          )}

          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", pt: 0.5 }}>
            <Button onClick={onClose} disabled={isSaving}>
              ביטול
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!text.trim() || isSaving}
            >
              הוסף
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}

function TodoItemCard({
  item,
  isSaving,
  onOpen,
  onToggleComplete,
  onDeleteItem,
}: {
  item: PersonalTodoItem;
  isSaving: boolean;
  onOpen: () => void;
  onToggleComplete: () => void;
  onDeleteItem: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        display: "flex",
        alignItems: "stretch",
        opacity: item.completed ? 0.75 : 1,
        transition: "opacity 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: 1,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 0.5,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <Checkbox
          checked={item.completed}
          onChange={onToggleComplete}
          disabled={isSaving}
          icon={<Box sx={{ width: 22, height: 22, borderRadius: "50%", border: 2, borderColor: "divider" }} />}
          checkedIcon={
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                bgcolor: "success.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "success.contrastText",
              }}
            >
              <TaskAltIcon sx={{ fontSize: 16 }} />
            </Box>
          }
          sx={{ p: 1 }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          py: 1.25,
          pr: 1,
          minWidth: 0,
          cursor: "pointer",
        }}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        aria-label={`ערוך: ${item.text}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            wordBreak: "break-word",
            textDecoration: item.completed ? "line-through" : "none",
            color: item.completed ? "text.secondary" : "text.primary",
          }}
        >
          {item.text}
        </Typography>
        {item.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.25,
              display: "block",
              wordBreak: "break-word",
              textDecoration: item.completed ? "line-through" : "none",
            }}
          >
            {item.description}
          </Typography>
        )}
        {item.dueDate && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, alignItems: "center" }}>
            <EventOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {formatDateOnly(item.dueDate)}
            </Typography>
          </Stack>
        )}
      </Box>

      <Stack
        direction="row"
        sx={{ pr: 0.5, alignItems: "center" }}
        onClick={(event) => event.stopPropagation()}
      >
        <Tooltip title="מחק">
          <span>
            <IconButton
              size="small"
              aria-label="מחק פריט"
              onClick={onDeleteItem}
              disabled={isSaving}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Card>
  );
}

function EmptyState({ filter }: { filter: TodoFilter }) {
  const message =
    filter === "completed"
      ? "אין פריטים שהושלמו"
      : "סיימתי הכל אין עליי!"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 6,
        px: 2,
        textAlign: "center",
      }}
    >
      <ChecklistIcon sx={{ fontSize: 56, color: "action.disabled", mb: 2 }} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

export default function PersonalTodoList({
  todos,
  isLoading,
  isSaving,
  onAddItem,
  onToggleComplete,
  onDeleteItem,
  onEditItem,
  onClearCompleted,
}: PersonalTodoListProps) {
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [completedExpanded, setCompletedExpanded] = useState(true);
  const [editingItem, setEditingItem] = useState<PersonalTodoItem | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const activeTodos = useMemo(() => todos.filter((item) => !item.completed), [todos]);
  const completedTodos = useMemo(() => todos.filter((item) => item.completed), [todos]);
  const completedCount = completedTodos.length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const filteredActive = filter === "completed" ? [] : activeTodos;
  const filteredCompleted = filter === "active" ? [] : completedTodos;
  const showSections = filter === "all" && totalCount > 0;
  const visibleItems =
    filter === "active"
      ? activeTodos
      : filter === "completed"
        ? completedTodos
        : [];

  const handleSaveEdit = (updates: TodoCreatePayload) => {
    if (!editingItem) {
      return;
    }

    onEditItem(editingItem.id, updates);
    setEditingItem(null);
  };

  const handleCreate = async (payload: TodoCreatePayload) => {
    const saved = await onAddItem(payload);
    if (saved) {
      setCreateSheetOpen(false);
    }
  };

  const renderItem = (item: PersonalTodoItem) => (
    <TodoItemCard
      key={item.id}
      item={item}
      isSaving={isSaving}
      onOpen={() => setEditingItem(item)}
      onToggleComplete={() => onToggleComplete(item.id)}
      onDeleteItem={() => onDeleteItem(item.id)}
    />
  );

  return (
    <>
    <Stack spacing={2.5}>
      {!isLoading && totalCount > 0 && (
        <Box sx={{ mb: -1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            {completedCount} מתוך {totalCount} הושלמו ({Math.round(progressPercent)}%)
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            color="success"
            aria-label={`${Math.round(progressPercent)}% מהמשימות הושלמו`}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": { borderRadius: 2 },
            }}
          />
        </Box>
      )}

      {totalCount > 0 && (
        <Stack
          direction="row"
          sx={{ gap: 1, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            onChange={(_, value: TodoFilter | null) => {
              if (value) {
                setFilter(value);
              }
            }}
            aria-label="סינון רשימה"
          >
            <ToggleButton value="all" aria-label="הכל">
              הכל
              <Chip label={totalCount} size="small" sx={{ ml: 0.75, height: 20, minWidth: 24 }} />
            </ToggleButton>
            <ToggleButton value="active" aria-label="פתוחות">
              פתוחות
              {activeTodos.length > 0 && (
                <Chip label={activeTodos.length} size="small" sx={{ ml: 0.75, height: 20, minWidth: 24 }} />
              )}
            </ToggleButton>
            <ToggleButton value="completed" aria-label="הושלמו">
              הושלמו
              {completedCount > 0 && (
                <Chip label={completedCount} size="small" sx={{ ml: 0.75, height: 20, minWidth: 24 }} />
              )}
            </ToggleButton>
          </ToggleButtonGroup>

          {completedCount > 0 && (
            <Button
              size="small"
              color="inherit"
              startIcon={<ClearAllIcon />}
              onClick={onClearCompleted}
              disabled={isSaving}
            >
              נקה הושלמו
            </Button>
          )}
        </Stack>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : totalCount === 0 ? (
        <EmptyState filter="all" />
      ) : showSections ? (
        <Stack spacing={2}>
          {filteredActive.length > 0 ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                פתוחות ({filteredActive.length})
              </Typography>
              {filteredActive.map(renderItem)}
            </Stack>
          ) : (
            <EmptyState filter="active" />
          )}

          {filteredCompleted.length > 0 && (
            <Box>
              <Button
                fullWidth
                color="inherit"
                onClick={() => setCompletedExpanded((prev) => !prev)}
                endIcon={completedExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                  justifyContent: "space-between",
                  px: 1,
                  py: 0.75,
                  mb: completedExpanded ? 1 : 0,
                  color: "text.secondary",
                }}
              >
                <Typography variant="subtitle2">הושלמו ({filteredCompleted.length})</Typography>
              </Button>
              <Collapse in={completedExpanded}>
                <Stack spacing={1}>{filteredCompleted.map(renderItem)}</Stack>
              </Collapse>
            </Box>
          )}
        </Stack>
      ) : visibleItems.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <Stack spacing={1}>{visibleItems.map(renderItem)}</Stack>
      )}

      <PersonalTodoEditDialog
        open={editingItem !== null}
        item={editingItem}
        isSaving={isSaving}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />
    </Stack>

    <Fab
      color="primary"
      aria-label="משימה חדשה"
      onClick={() => setCreateSheetOpen(true)}
      sx={{
        position: "fixed",
        bottom: APP_BOTTOM_BAR_HEIGHT + 16,
        insetInlineStart: 24,
      }}
    >
      <AddIcon />
    </Fab>

    <PersonalTodoCreateSheet
      open={createSheetOpen}
      isSaving={isSaving}
      onClose={() => setCreateSheetOpen(false)}
      onCreate={handleCreate}
    />
    </>
  );
}
