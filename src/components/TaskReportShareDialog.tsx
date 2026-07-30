import { useEffect, useMemo, useState } from "react";
import ShareIcon from "@mui/icons-material/Share";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { fetchTaskCompletions } from "@/lib/fetchTaskCompletions";
import {
  formatDueDate,
  isDueInLastSevenDays,
} from "@/lib/taskDate";
import { renderTaskReportImage } from "@/lib/renderTaskReportImage";
import { shareImageFile } from "@/lib/shareImageFile";
import type {
  ListTaskCompletionsErrorResponse,
  ListTaskCompletionsSuccessResponse,
  PublicTask,
} from "@/types/task";
import type { TaskReportEntry } from "@/types/taskReport";

type DialogStep = "select" | "preview";

interface TaskReportShareDialogProps {
  open: boolean;
  tasks: PublicTask[];
  userId: string;
  onClose: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function TaskReportShareDialog({
  open,
  tasks,
  userId,
  onClose,
  onError,
  onSuccess,
}: TaskReportShareDialogProps) {
  const [step, setStep] = useState<DialogStep>("select");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
      ),
    [tasks],
  );

  const selectedTasks = useMemo(
    () => sortedTasks.filter((task) => selectedTaskIds.has(task.id)),
    [sortedTasks, selectedTaskIds],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    void Promise.resolve().then(() => {
      setStep("select");
      setSelectedTaskIds(new Set());
      setImageUrl(null);
      setImageBlob(null);
      setIsGenerating(false);
      setIsSharing(false);
    });
  }, [open, tasks]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedTaskIds(new Set(sortedTasks.map((task) => task.id)));
  };

  const handleSelectLastSevenDays = () => {
    setSelectedTaskIds(
      new Set(
        sortedTasks
          .filter((task) => isDueInLastSevenDays(task.dueDate))
          .map((task) => task.id),
      ),
    );
  };

  const handleClearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  const handleBackToSelect = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    setImageBlob(null);
    setStep("select");
  };

  const loadReportEntries = async (
    tasksToReport: PublicTask[],
  ): Promise<TaskReportEntry[] | null> => {
    const results = await Promise.all(
      tasksToReport.map((task) => fetchTaskCompletions(task.id, userId)),
    );

    const entries: TaskReportEntry[] = [];

    for (let index = 0; index < tasksToReport.length; index += 1) {
      const task = tasksToReport[index];
      const { response, data } = results[index];

      if (!response.ok) {
        const { error } = data as ListTaskCompletionsErrorResponse;
        onError(error ?? "טעינת סטטוס הביצוע נכשלה");
        return null;
      }

      const assignees = (data as ListTaskCompletionsSuccessResponse).assignees;
      const completedCount = assignees.filter((assignee) => assignee.completed).length;

      entries.push({
        task,
        completedCount,
        totalCount: assignees.length,
      });
    }

    return entries;
  };

  const handleGenerateImage = async () => {
    if (selectedTasks.length === 0) {
      return;
    }

    setIsGenerating(true);

    try {
      const entries = await loadReportEntries(selectedTasks);
      if (!entries) {
        return;
      }

      const appUrl = `${window.location.origin}/allTasks`;
      const blob = await renderTaskReportImage(entries, { appUrl });
      const url = URL.createObjectURL(blob);
      setImageBlob(blob);
      setImageUrl(url);
      setStep("preview");
    } catch {
      onError("יצירת התמונה נכשלה. נסה שוב.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareImage = async () => {
    if (!imageBlob) {
      return;
    }

    setIsSharing(true);

    try {
      const appUrl = `${window.location.origin}/allTasks`;
      const result = await shareImageFile(
        imageBlob,
        "tagabia-report.png",
        "דוח מטלות",
        appUrl,
      );
      if (result === "shared") {
        onSuccess("הדוח שותף בהצלחה");
        onClose();
      } else {
        onSuccess("התמונה הורדה למכשיר");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      onError("שיתוף התמונה נכשל");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {step === "select" ? "בחר מטלות לדוח" : "תצוגה מקדימה"}
      </DialogTitle>
      <DialogContent>
        {step === "select" ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              בחר את המטלות שיופיעו בתמונה לשיתוף בוואטסאפ או בקבוצה.
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
              <Button size="small" onClick={handleSelectAll}>
                בחר הכל
              </Button>
              <Button size="small" onClick={handleSelectLastSevenDays}>
                בחר 7 ימים אחרונים
              </Button>
              <Button size="small" onClick={handleClearSelection}>
                נקה בחירה
              </Button>
            </Box>
            <List disablePadding>
              {sortedTasks.map((task) => (
                <ListItem key={task.id} disablePadding divider>
                  <ListItemButton onClick={() => handleToggleTask(task.id)} dense>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox
                        edge="start"
                        checked={selectedTaskIds.has(task.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={`תג"ב: ${formatDueDate(task.dueDate)}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        ) : imageUrl ? (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Box
              component="img"
              src={imageUrl}
              alt="דוח מטלות"
              sx={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            />
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
        {step === "select" ? (
          <>
            <Button onClick={onClose}>ביטול</Button>
            <Button
              variant="contained"
              disabled={selectedTasks.length === 0 || isGenerating}
              onClick={() => void handleGenerateImage()}
            >
              {isGenerating ? "יוצר תמונה..." : "צור תמונה"}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleBackToSelect} disabled={isSharing}>
              חזרה לבחירה
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={onClose} disabled={isSharing}>
                סגור
              </Button>
              <Button
                variant="contained"
                startIcon={
                  isSharing ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <ShareIcon />
                  )
                }
                disabled={!imageBlob || isSharing}
                onClick={() => void handleShareImage()}
              >
                {isSharing ? "משתף..." : "שתף"}
              </Button>
            </Box>
          </>
        )}
      </DialogActions>

      {isGenerating ? (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: (theme) => theme.zIndex.modal + 1,
          }}
        >
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: 2,
              px: 3,
              py: 2.5,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress size={24} />
            <Typography>יוצר תמונה...</Typography>
          </Box>
        </Box>
      ) : null}
    </Dialog>
  );
}
