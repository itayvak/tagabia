import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { deleteTaskMedia } from "@/lib/deleteTaskMedia";
import { getTaskErrorMessage } from "@/lib/taskErrorMessages";
import {
  formatTaskMediaFileSize,
  MAX_TASK_MEDIA_FILES,
  MAX_TASK_MEDIA_FILE_SIZE_MB,
  validateTaskMediaFile,
} from "@/lib/taskMediaValidation";
import { uploadTaskMedia } from "@/lib/uploadTaskMedia";
import type { TaskMedia } from "@/types/task";

interface TaskMediaUploadProps {
  mode: "create" | "edit";
  disabled?: boolean;
  hideTitle?: boolean;
  taskId?: string;
  userId?: string;
  initialMedia?: TaskMedia[];
  pendingMedia: File[];
  onPendingMediaChange: (files: File[]) => void;
  onError?: (message: string) => void;
}

function getTotalMediaCount(
  mode: "create" | "edit",
  media: TaskMedia[],
  pendingMedia: File[],
): number {
  return mode === "create" ? pendingMedia.length : media.length;
}

export default function TaskMediaUpload({
  mode,
  disabled = false,
  hideTitle = false,
  taskId,
  userId,
  initialMedia = [],
  pendingMedia,
  onPendingMediaChange,
  onError,
}: TaskMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<TaskMedia[]>(initialMedia);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  const isBusy = disabled || uploadingCount > 0 || deletingMediaId !== null;
  const totalCount = getTotalMediaCount(mode, media, pendingMedia);
  const canAddMore = totalCount < MAX_TASK_MEDIA_FILES;

  const reportError = (error: string) => {
    const message = getTaskErrorMessage(error);
    setLocalError(message);
    onError?.(message);
  };

  const handleUploadClick = () => {
    if (!canAddMore || isBusy) {
      return;
    }

    setLocalError(null);
    fileInputRef.current?.click();
  };

  const handleCreateFileSelected = (files: File[]) => {
    const nextFiles = [...pendingMedia];
    let addedCount = 0;

    for (const file of files) {
      if (nextFiles.length >= MAX_TASK_MEDIA_FILES) {
        reportError("Maximum number of media files reached");
        break;
      }

      const validationError = validateTaskMediaFile(file);
      if (validationError) {
        reportError(validationError);
        continue;
      }

      nextFiles.push(file);
      addedCount += 1;
    }

    if (addedCount > 0) {
      setLocalError(null);
      onPendingMediaChange(nextFiles);
    }
  };

  const handleEditFileSelected = async (files: File[]) => {
    if (!taskId || !userId) {
      return;
    }

    for (const file of files) {
      if (media.length >= MAX_TASK_MEDIA_FILES) {
        reportError("Maximum number of media files reached");
        break;
      }

      const validationError = validateTaskMediaFile(file);
      if (validationError) {
        reportError(validationError);
        continue;
      }

      setUploadingCount((count) => count + 1);

      try {
        const { response, data } = await uploadTaskMedia(taskId, userId, file);

        if (!response.ok) {
          reportError("error" in data ? data.error : "Upload task media failed");
          continue;
        }

        if (!("media" in data)) {
          reportError("Upload task media failed");
          continue;
        }

        setMedia((current) => [...current, data.media]);
      } catch {
        reportError("Upload task media failed");
      } finally {
        setUploadingCount((count) => Math.max(0, count - 1));
      }
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    if (mode === "create") {
      handleCreateFileSelected(selectedFiles);
      return;
    }

    void handleEditFileSelected(selectedFiles);
  };

  const handleRemovePendingFile = (index: number) => {
    onPendingMediaChange(pendingMedia.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleRemoveExistingMedia = async (mediaItem: TaskMedia) => {
    if (!taskId || !userId || isBusy) {
      return;
    }

    setDeletingMediaId(mediaItem.id);

    try {
      const { response, data } = await deleteTaskMedia(
        taskId,
        mediaItem.id,
        userId,
      );

      if (!response.ok) {
        reportError("error" in data ? data.error : "Delete task media failed");
        return;
      }

      setMedia((current) =>
        current.filter((item) => item.id !== mediaItem.id),
      );
    } catch {
      reportError("Delete task media failed");
    } finally {
      setDeletingMediaId(null);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {hideTitle ? null : (
        <Typography variant="subtitle1">קבצים מצורפים</Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        ניתן להעלות עד {MAX_TASK_MEDIA_FILES} קבצים (תמונות, סרטונים, PDF) עד{" "}
        {MAX_TASK_MEDIA_FILE_SIZE_MB}MB
        לכל קובץ
      </Typography>
      <Button
        type="button"
        variant="outlined"
        startIcon={<AttachFileIcon />}
        onClick={handleUploadClick}
        disabled={!canAddMore || isBusy}
      >
        {uploadingCount > 0 ? "מעלה..." : "הוסף קובץ"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        multiple
        accept="image/*,video/*,.pdf,application/pdf"
        onChange={handleFileSelected}
      />
      {localError ? (
        <Alert severity="error" onClose={() => setLocalError(null)}>
          {localError}
        </Alert>
      ) : null}
      {mode === "create" && pendingMedia.length > 0 ? (
        <List dense disablePadding>
          {pendingMedia.map((file, index) => (
            <ListItem
              key={`${file.name}-${file.size}-${index}`}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="הסר קובץ"
                  onClick={() => handleRemovePendingFile(index)}
                  disabled={isBusy}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText
                primary={file.name}
                secondary={formatTaskMediaFileSize(file.size)}
              />
            </ListItem>
          ))}
        </List>
      ) : null}
      {mode === "edit" && media.length > 0 ? (
        <List dense disablePadding>
          {media.map((mediaItem) => (
            <ListItem
              key={mediaItem.id}
              secondaryAction={
                deletingMediaId === mediaItem.id ? (
                  <CircularProgress size={20} />
                ) : (
                  <IconButton
                    edge="end"
                    aria-label="הסר קובץ"
                    onClick={() => void handleRemoveExistingMedia(mediaItem)}
                    disabled={isBusy}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={mediaItem.name}
                secondary={formatTaskMediaFileSize(mediaItem.size)}
              />
            </ListItem>
          ))}
        </List>
      ) : null}
    </Box>
  );
}
