import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { fetchWorkEnvironmentFiles } from "@/lib/fetchWorkEnvironmentFiles";
import { formatTaskMediaFileSize } from "@/lib/taskMediaValidation";
import { uploadWorkEnvironmentFile } from "@/lib/uploadWorkEnvironmentFile";
import { getWorkEnvironmentErrorMessage } from "@/lib/workEnvironmentErrorMessages";
import {
  isAllowedWorkEnvironmentFileContentType,
  MAX_WORK_ENVIRONMENT_FILE_SIZE_BYTES,
  resolveWorkEnvironmentFileContentType,
} from "@/lib/workEnvironmentFileValidation";
import type {
  ListWorkEnvironmentFilesErrorResponse,
  ListWorkEnvironmentFilesSuccessResponse,
  PublicWorkEnvironmentFile,
  UploadWorkEnvironmentFileErrorResponse,
  UploadWorkEnvironmentFileSuccessResponse,
  WorkEnvironmentFileKey,
} from "@/types/workEnvironment";

/** The two toolbox pills on /workEnvironment, in the order they appear there. */
const UPLOAD_ROWS: { key: WorkEnvironmentFileKey; label: string }[] = [
  { key: "shuttles", label: "שאטלים" },
  { key: "guardRosters", label: "תורניות ושמירות" },
];

const EXCEL_INPUT_ACCEPT =
  ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

function openMediaUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

interface WorkEnvironmentFileUploadsProps {
  userId: string;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function WorkEnvironmentFileUploads({
  userId,
  onError,
  onSuccess,
}: WorkEnvironmentFileUploadsProps) {
  // One input per row, so picking a shuttles file can't land on the roster row.
  const fileInputRefs = useRef<
    Partial<Record<WorkEnvironmentFileKey, HTMLInputElement | null>>
  >({});
  const [files, setFiles] = useState<PublicWorkEnvironmentFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<WorkEnvironmentFileKey | null>(
    null,
  );

  // Callers pass inline arrows; keeping them in a ref stops loadFiles from
  // changing identity every render and re-triggering the fetch effect.
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onErrorRef.current = onError;
    onSuccessRef.current = onSuccess;
  }, [onError, onSuccess]);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);

    try {
      const { response, data } = await fetchWorkEnvironmentFiles();

      if (!response.ok) {
        const { error } = data as ListWorkEnvironmentFilesErrorResponse;
        onErrorRef.current(
          getWorkEnvironmentErrorMessage(
            error ?? "List work environment files failed",
          ),
        );
        return;
      }

      setFiles((data as ListWorkEnvironmentFilesSuccessResponse).files);
    } catch {
      onErrorRef.current(
        getWorkEnvironmentErrorMessage("List work environment files failed"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, matches this app's data-loading convention
    void loadFiles();
  }, [loadFiles]);

  const handleFileSelected = async (
    fileKey: WorkEnvironmentFileKey,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    // Checked again on the server; this only saves a round trip on the two
    // mistakes users actually make — wrong format and oversized workbooks.
    const contentType = resolveWorkEnvironmentFileContentType(file.type, file.name);
    if (!isAllowedWorkEnvironmentFileContentType(fileKey, contentType)) {
      onErrorRef.current(
        getWorkEnvironmentErrorMessage("File type is not allowed"),
      );
      return;
    }

    if (file.size > MAX_WORK_ENVIRONMENT_FILE_SIZE_BYTES) {
      onErrorRef.current(getWorkEnvironmentErrorMessage("File is too large"));
      return;
    }

    setUploadingKey(fileKey);

    try {
      const { response, data } = await uploadWorkEnvironmentFile(
        fileKey,
        userId,
        file,
      );

      if (!response.ok) {
        const { error } = data as UploadWorkEnvironmentFileErrorResponse;
        onErrorRef.current(
          getWorkEnvironmentErrorMessage(
            error ?? "Upload work environment file failed",
          ),
        );
        return;
      }

      const uploaded = (data as UploadWorkEnvironmentFileSuccessResponse).file;
      setFiles((current) => [
        ...current.filter((entry) => entry.key !== uploaded.key),
        uploaded,
      ]);
      onSuccessRef.current("הקובץ הועלה בהצלחה");
    } catch {
      onErrorRef.current(
        getWorkEnvironmentErrorMessage("Upload work environment file failed"),
      );
    } finally {
      setUploadingKey(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        הקבצים מוצגים לצוערים בארגז הכלים. העלאה חדשה מחליפה את הקובץ הקיים.
      </Typography>

      {UPLOAD_ROWS.map((row, index) => {
        const media = files.find((entry) => entry.key === row.key)?.media ?? null;
        const isUploading = uploadingKey === row.key;

        return (
          <Box key={row.key} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {index > 0 && <Divider />}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2">{row.label}</Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", wordBreak: "break-word" }}
              >
                {media
                  ? `${media.name} · ${formatTaskMediaFileSize(media.size)}`
                  : "לא הועלה קובץ"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRefs.current[row.key]?.click()}
                disabled={uploadingKey !== null}
                sx={{ flex: { xs: "1 1 100%", sm: "1 1 auto" } }}
              >
                {isUploading ? "מעלה..." : media ? "החלף קובץ" : "העלה קובץ"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => media && openMediaUrl(media.url)}
                disabled={!media || uploadingKey !== null}
                sx={{ flex: { xs: "1 1 100%", sm: "1 1 auto" } }}
              >
                הורדה
              </Button>
              <input
                ref={(element) => {
                  fileInputRefs.current[row.key] = element;
                }}
                type="file"
                accept={EXCEL_INPUT_ACCEPT}
                hidden
                onChange={(event) => void handleFileSelected(row.key, event)}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
