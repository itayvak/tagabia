import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { type ChangeEvent, useRef, useState } from "react";
import { validateTaskCompletionMediaFile } from "@/lib/taskCompletionMedia";
import { getTaskErrorMessage } from "@/lib/taskErrorMessages";
import { formatTaskMediaFileSize } from "@/lib/taskMediaValidation";

interface TaskCompletionMediaUploadProps {
  disabled?: boolean;
  required?: boolean;
  maxFiles: number;
  pendingFiles: File[];
  onChange: (files: File[]) => void;
}

export default function TaskCompletionMediaUpload({
  disabled = false,
  required = false,
  maxFiles,
  pendingFiles,
  onChange,
}: TaskCompletionMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const canAddMore = pendingFiles.length < maxFiles;

  const handleOpenPicker = () => {
    if (disabled || !canAddMore) {
      return;
    }

    setError(null);
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const nextFiles = [...pendingFiles];

    for (const file of selectedFiles) {
      if (nextFiles.length >= maxFiles) {
        setError(getTaskErrorMessage("Maximum number of completion files reached"));
        break;
      }

      const validationError = validateTaskCompletionMediaFile(file);
      if (validationError) {
        setError(getTaskErrorMessage(validationError));
        continue;
      }

      nextFiles.push(file);
    }

    onChange(nextFiles);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="subtitle2">
        {required ? "יש לצרף קובץ להגשה" : "ניתן לצרף קבצים להגשה"}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        ניתן להעלות עד {maxFiles} קבצים בעת השלמת המטלה.
      </Typography>
      <Button
        type="button"
        variant="outlined"
        startIcon={<AttachFileIcon />}
        onClick={handleOpenPicker}
        disabled={disabled || !canAddMore}
      >
        הוסף קובץ להגשה
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        multiple={maxFiles > 1}
        accept="image/*,video/*,.pdf,application/pdf"
        onChange={handleFilesSelected}
      />
      {error ? (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {pendingFiles.length > 0 ? (
        <List dense disablePadding>
          {pendingFiles.map((file, index) => (
            <ListItem
              key={`${file.name}-${file.size}-${index}`}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="הסר קובץ"
                  onClick={() =>
                    onChange(
                      pendingFiles.filter((_, fileIndex) => fileIndex !== index),
                    )
                  }
                  disabled={disabled}
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
    </Box>
  );
}
