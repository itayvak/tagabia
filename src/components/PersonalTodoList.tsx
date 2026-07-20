import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import type { PersonalTodoItem } from "@/types/user";

type TodoFilter = "all" | "active" | "completed";

interface PersonalTodoListProps {
  todos: PersonalTodoItem[];
  isLoading: boolean;
  isSaving: boolean;
  newItemText: string;
  newItemDescription: string;
  onNewItemTextChange: (text: string) => void;
  onNewItemDescriptionChange: (description: string) => void;
  onAddItem: () => void;
  onToggleComplete: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (id: string, updates: { text: string; description?: string }) => void;
  onClearCompleted: () => void;
}

function TodoItemCard({
  item,
  isSaving,
  isEditing,
  editingText,
  editingDescription,
  onEditingTextChange,
  onEditingDescriptionChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleComplete,
  onDeleteItem,
}: {
  item: PersonalTodoItem;
  isSaving: boolean;
  isEditing: boolean;
  editingText: string;
  editingDescription: string;
  onEditingTextChange: (text: string) => void;
  onEditingDescriptionChange: (description: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleComplete: () => void;
  onDeleteItem: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        display: "flex",
        alignItems: isEditing ? "flex-start" : "stretch",
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
      >
        <Checkbox
          checked={item.completed}
          onChange={onToggleComplete}
          disabled={isSaving || isEditing}
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

      <Box sx={{ flex: 1, py: 1.25, pr: 1, minWidth: 0 }}>
        {isEditing ? (
          <Stack spacing={1}>
            <TextField
              fullWidth
              size="small"
              label="כותרת"
              value={editingText}
              onChange={(event) => onEditingTextChange(event.target.value)}
              autoFocus
              disabled={isSaving}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelEdit();
                }
              }}
              slotProps={{
                htmlInput: { dir: "rtl", "aria-label": "עריכת כותרת" },
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="תיאור (אופציונלי)"
              value={editingDescription}
              onChange={(event) => onEditingDescriptionChange(event.target.value)}
              disabled={isSaving}
              multiline
              minRows={2}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelEdit();
                }
              }}
              slotProps={{
                htmlInput: { dir: "rtl", "aria-label": "עריכת תיאור" },
              }}
            />
          </Stack>
        ) : (
          <>
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
          </>
        )}
      </Box>

      <Stack direction="row" sx={{ pr: 0.5, pt: isEditing ? 1 : 0, alignItems: "center" }}>
        {isEditing ? (
          <Stack spacing={0.5}>
            <Button size="small" onClick={onSaveEdit} disabled={!editingText.trim() || isSaving}>
              שמור
            </Button>
            <Button size="small" color="inherit" onClick={onCancelEdit} disabled={isSaving}>
              ביטול
            </Button>
          </Stack>
        ) : (
          <>
            <Tooltip title="עריכה">
              <span>
                <IconButton
                  size="small"
                  aria-label="ערוך פריט"
                  onClick={onStartEdit}
                  disabled={isSaving}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
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
          </>
        )}
      </Stack>
    </Card>
  );
}

function EmptyState({ filter }: { filter: TodoFilter }) {
  const message =
    filter === "completed"
      ? "אין פריטים שהושלמו"
      : filter === "active"
        ? "אין פריטים פתוחים — הכל מסודר!"
        : "הרשימה ריקה. הוסיפו את הפריט הראשון.";

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
  newItemText,
  newItemDescription,
  onNewItemTextChange,
  onNewItemDescriptionChange,
  onAddItem,
  onToggleComplete,
  onDeleteItem,
  onEditItem,
  onClearCompleted,
}: PersonalTodoListProps) {
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [completedExpanded, setCompletedExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const activeTodos = useMemo(() => todos.filter((item) => !item.completed), [todos]);
  const completedTodos = useMemo(() => todos.filter((item) => item.completed), [todos]);
  const completedCount = completedTodos.length;
  const totalCount = todos.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const filteredActive = filter === "completed" ? [] : activeTodos;
  const filteredCompleted = filter === "active" ? [] : completedTodos;
  const showSections = filter === "all" && totalCount > 0;
  const visibleItems =
    filter === "active"
      ? activeTodos
      : filter === "completed"
        ? completedTodos
        : [];

  const startEdit = (item: PersonalTodoItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
    setEditingDescription(item.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
    setEditingDescription("");
  };

  const saveEdit = () => {
    if (!editingId) {
      return;
    }

    const trimmed = editingText.trim();
    if (!trimmed) {
      return;
    }

    const trimmedDescription = editingDescription.trim();
    onEditItem(editingId, {
      text: trimmed,
      description: trimmedDescription || undefined,
    });
    cancelEdit();
  };

  const renderItem = (item: PersonalTodoItem) => (
    <TodoItemCard
      key={item.id}
      item={item}
      isSaving={isSaving}
      isEditing={editingId === item.id}
      editingText={editingText}
      editingDescription={editingDescription}
      onEditingTextChange={setEditingText}
      onEditingDescriptionChange={setEditingDescription}
      onStartEdit={() => startEdit(item)}
      onSaveEdit={saveEdit}
      onCancelEdit={cancelEdit}
      onToggleComplete={() => onToggleComplete(item.id)}
      onDeleteItem={() => onDeleteItem(item.id)}
    />
  );

  return (
    <Stack spacing={2.5}>
      {totalCount > 0 && (
        <Box>
          <Stack direction="row" sx={{ mb: 1, justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {completedCount} מתוך {totalCount} הושלמו
            </Typography>
            {isSaving && (
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">
                  שומר...
                </Typography>
              </Stack>
            )}
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": { borderRadius: 3 },
            }}
          />
        </Box>
      )}

      <Card variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              label="כותרת"
              placeholder="מה צריך לעשות?"
              value={newItemText}
              onChange={(event) => onNewItemTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onAddItem();
                }
              }}
              disabled={isSaving}
              slotProps={{
                htmlInput: { dir: "rtl", "aria-label": "פריט חדש" },
                input: {
                  endAdornment: newItemText.trim() ? (
                    <InputAdornment position="end">
                      <Chip label="Enter" size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddItem}
              disabled={!newItemText.trim() || isSaving}
              sx={{ flexShrink: 0, whiteSpace: "nowrap", alignSelf: { xs: "stretch", sm: "flex-start" } }}
            >
              הוסף
            </Button>
          </Stack>
          <TextField
            fullWidth
            size="small"
            label="תיאור (אופציונלי)"
            placeholder="פרטים נוספים..."
            value={newItemDescription}
            onChange={(event) => onNewItemDescriptionChange(event.target.value)}
            disabled={isSaving}
            multiline
            minRows={2}
            slotProps={{
              htmlInput: { dir: "rtl", "aria-label": "תיאור פריט חדש" },
            }}
          />
        </Stack>
      </Card>

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
    </Stack>
  );
}
