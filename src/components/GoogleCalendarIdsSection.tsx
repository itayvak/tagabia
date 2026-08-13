import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { fetchGoogleCalendarConfig } from "@/lib/fetchGoogleCalendarConfig";
import { isValidCalendarId } from "@/lib/googleCalendarConfigMapper";
import { formatPlatoonLabel, PLATOONS } from "@/lib/platoons";
import { updateGoogleCalendarConfig } from "@/lib/updateGoogleCalendarConfig";
import type {
  GetGoogleCalendarConfigErrorResponse,
  GetGoogleCalendarConfigSuccessResponse,
  GoogleCalendarIdsByPlatoon,
  UpdateGoogleCalendarConfigErrorResponse,
  UpdateGoogleCalendarConfigSuccessResponse,
} from "@/types/googleCalendar";
import type { Platoon } from "@/types/user";

function getErrorMessage(error: string): string {
  switch (error) {
    case "User ID is required":
      return "מזהה משתמש חסר";
    case "Forbidden":
      return "אין לך הרשאה לפעולה זו";
    case "Invalid calendar address":
      return "כתובת יומן אינה תקינה";
    case "Get google calendar config failed":
      return "טעינת יומני הפלוגות נכשלה";
    case "Update google calendar config failed":
      return "שמירת יומני הפלוגות נכשלה";
    default:
      return error;
  }
}

function toFormValues(calendarIds: GoogleCalendarIdsByPlatoon) {
  return Object.fromEntries(
    PLATOONS.map((platoon) => [platoon, calendarIds[platoon] ?? ""]),
  ) as Record<Platoon, string>;
}

interface GoogleCalendarIdsSectionProps {
  userId: string;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function GoogleCalendarIdsSection({
  userId,
  onError,
  onSuccess,
}: GoogleCalendarIdsSectionProps) {
  const [values, setValues] = useState<Record<Platoon, string>>(() =>
    toFormValues({}),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Callers pass inline arrows; the ref keeps loadConfig's identity stable so
  // the fetch effect runs once.
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onErrorRef.current = onError;
    onSuccessRef.current = onSuccess;
  }, [onError, onSuccess]);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);

    try {
      const { response, data } = await fetchGoogleCalendarConfig(userId);

      if (!response.ok) {
        const { error } = data as GetGoogleCalendarConfigErrorResponse;
        onErrorRef.current(
          getErrorMessage(error ?? "Get google calendar config failed"),
        );
        return;
      }

      const { config } = data as GetGoogleCalendarConfigSuccessResponse;
      setValues(toFormValues(config.calendarIds));
    } catch {
      onErrorRef.current(getErrorMessage("Get google calendar config failed"));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, matches this app's data-loading convention
    void loadConfig();
  }, [loadConfig]);

  const invalidPlatoons = PLATOONS.filter((platoon) => {
    const value = values[platoon].trim();
    return value !== "" && !isValidCalendarId(value);
  });

  const handleSave = async () => {
    if (invalidPlatoons.length > 0) {
      onErrorRef.current(getErrorMessage("Invalid calendar address"));
      return;
    }

    setIsSaving(true);

    try {
      const calendarIds: GoogleCalendarIdsByPlatoon = {};
      for (const platoon of PLATOONS) {
        const value = values[platoon].trim();
        if (value) {
          calendarIds[platoon] = value;
        }
      }

      const { response, data } = await updateGoogleCalendarConfig({
        userId,
        calendarIds,
      });

      if (!response.ok) {
        const { error } = data as UpdateGoogleCalendarConfigErrorResponse;
        onErrorRef.current(
          getErrorMessage(error ?? "Update google calendar config failed"),
        );
        return;
      }

      const { config } = data as UpdateGoogleCalendarConfigSuccessResponse;
      setValues(toFormValues(config.calendarIds));
      onSuccessRef.current("יומני הפלוגות נשמרו");
    } catch {
      onErrorRef.current(
        getErrorMessage("Update google calendar config failed"),
      );
    } finally {
      setIsSaving(false);
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
        כתובת יומן Google לכל פלוגה. פלוגה ללא כתובת תראה &quot;לוח שנה פלוגתי
        אינו מחובר&quot;. יש לשתף כל יומן עם חשבון השירות של המערכת.
      </Typography>

      {PLATOONS.map((platoon) => (
        <TextField
          key={platoon}
          label={formatPlatoonLabel(platoon)}
          value={values[platoon]}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              [platoon]: event.target.value,
            }))
          }
          error={invalidPlatoons.includes(platoon)}
          helperText={
            invalidPlatoons.includes(platoon) ? "כתובת יומן אינה תקינה" : " "
          }
          placeholder="example@group.calendar.google.com"
          disabled={isSaving}
          fullWidth
          size="small"
          slotProps={{ htmlInput: { dir: "ltr" } }}
        />
      ))}

      <Button
        variant="contained"
        onClick={() => void handleSave()}
        disabled={isSaving || invalidPlatoons.length > 0}
        fullWidth
      >
        {isSaving ? "שומר..." : "שמור יומנים"}
      </Button>
    </Box>
  );
}
