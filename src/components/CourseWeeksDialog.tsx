import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { fetchCourseConfig } from "@/lib/fetchCourseConfig";
import { updateCourseConfig } from "@/lib/updateCourseConfig";
import { WEEK_CATALOG } from "@/lib/weekCatalog";
import type {
  GetCourseConfigSuccessResponse,
  StoredCourseWeek,
  UpdateCourseConfigErrorResponse,
  UpdateCourseConfigSuccessResponse,
} from "@/types/courseConfig";

interface CourseWeeksDialogProps {
  open: boolean;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

function getErrorMessage(error: string): string {
  switch (error) {
    case "User ID is required":
      return "מזהה משתמש חסר";
    case "Forbidden":
      return "אין לך הרשאה לפעולה זו";
    case "Start date is required":
      return "יש לבחור תאריך התחלה";
    case "At least one week is required":
      return "יש להוסיף לפחות שבוע אחד";
    case "Get course config failed":
      return "טעינת הגדרות הקורס נכשלה";
    case "Update course config failed":
      return "שמירת הגדרות הקורס נכשלה";
    default:
      return error;
  }
}

export default function CourseWeeksDialog({
  open,
  userId,
  onClose,
  onSaved,
  onError,
}: CourseWeeksDialogProps) {
  const [startDate, setStartDate] = useState("");
  const [weeks, setWeeks] = useState<StoredCourseWeek[]>([{ weekId: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadConfig = async () => {
      setIsLoading(true);

      try {
        const { response, data } = await fetchCourseConfig();

        if (!response.ok) {
          onError(getErrorMessage((data as { error?: string }).error ?? "Get course config failed"));
          return;
        }

        const config = (data as GetCourseConfigSuccessResponse).config;
        if (config) {
          setStartDate(config.startDate);
          setWeeks(config.weeks.map((week) => ({ weekId: week.weekId })));
        } else {
          setStartDate("");
          setWeeks([{ weekId: "" }]);
        }
      } catch {
        onError(getErrorMessage("Get course config failed"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadConfig();
  }, [open]);

  const handleWeekChange = (index: number, weekId: string) => {
    setWeeks((currentWeeks) =>
      currentWeeks.map((week, weekIndex) =>
        weekIndex === index ? { weekId } : week,
      ),
    );
  };

  const handleAddWeek = () => {
    setWeeks((currentWeeks) => [...currentWeeks, { weekId: "" }]);
  };

  const handleRemoveWeek = (index: number) => {
    setWeeks((currentWeeks) =>
      currentWeeks.filter((_, weekIndex) => weekIndex !== index),
    );
  };

  const handleMoveWeek = (index: number, direction: "up" | "down") => {
    setWeeks((currentWeeks) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentWeeks.length) {
        return currentWeeks;
      }

      const nextWeeks = [...currentWeeks];
      [nextWeeks[index], nextWeeks[targetIndex]] = [
        nextWeeks[targetIndex],
        nextWeeks[index],
      ];
      return nextWeeks;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { response, data } = await updateCourseConfig({
        userId,
        startDate,
        weeks,
      });

      if (!response.ok) {
        const { error } = data as UpdateCourseConfigErrorResponse;
        onError(getErrorMessage(error ?? "Update course config failed"));
        return;
      }

      const config = (data as UpdateCourseConfigSuccessResponse).config;
      setStartDate(config.startDate);
      setWeeks(config.weeks.map((week) => ({ weekId: week.weekId })));
      onSaved();
      onClose();
    } catch {
      onError(getErrorMessage("Update course config failed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>עריכת שבועות הקורס</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="תאריך התחלת הקורס"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { dir: "ltr" },
              }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="subtitle2">שבועות הקורס</Typography>
              {weeks.map((week, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ minWidth: 56 }}
                    >
                      שבוע {index}
                    </Typography>
                    <TextField
                      select
                      value={week.weekId}
                      onChange={(event) =>
                        handleWeekChange(index, event.target.value)
                      }
                      label="בחר שבוע"
                      fullWidth
                      size="small"
                    >
                      <MenuItem value="">
                        <em>בחר שבוע</em>
                      </MenuItem>
                      {WEEK_CATALOG.map((catalogWeek) => (
                        <MenuItem key={catalogWeek.id} value={catalogWeek.id}>
                          {catalogWeek.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <IconButton
                        aria-label={`הזז שבוע ${index + 1} למעלה`}
                        onClick={() => handleMoveWeek(index, "up")}
                        disabled={index === 0 || isSaving}
                        size="small"
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`הזז שבוע ${index + 1} למטה`}
                        onClick={() => handleMoveWeek(index, "down")}
                        disabled={index === weeks.length - 1 || isSaving}
                        size="small"
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <IconButton
                      aria-label={`הסר שבוע ${index + 1}`}
                      onClick={() => handleRemoveWeek(index)}
                      disabled={weeks.length === 1 || isSaving}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddWeek}
                disabled={isSaving}
                sx={{ alignSelf: "flex-start" }}
              >
                הוסף שבוע
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSaving}>
          ביטול
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={isLoading || isSaving}
        >
          {isSaving ? "שומר..." : "שמור"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
