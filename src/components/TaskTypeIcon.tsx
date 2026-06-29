import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DynamicFormOutlinedIcon from "@mui/icons-material/DynamicFormOutlined";
import { Box, Tooltip } from "@mui/material";

interface TaskTypeIconProps {
  hasFormFields: boolean;
}

const iconSx = {
  fontSize: 15,
  color: "text.disabled",
  opacity: 0.65,
  flexShrink: 0,
  mt: "2px",
} as const;

export default function TaskTypeIcon({ hasFormFields }: TaskTypeIconProps) {
  if (hasFormFields) {
    return (
      <Tooltip title="מטלת טופס" enterDelay={400}>
        <Box component="span" sx={{ display: "inline-flex", lineHeight: 0 }}>
          <DynamicFormOutlinedIcon
            sx={iconSx}
            aria-label="מטלת טופס"
          />
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="מטלה לסימון" enterDelay={400}>
      <Box component="span" sx={{ display: "inline-flex", lineHeight: 0 }}>
        <CheckCircleOutlinedIcon
          sx={iconSx}
          aria-label="מטלה לסימון"
        />
      </Box>
    </Tooltip>
  );
}
