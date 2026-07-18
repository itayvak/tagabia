import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import PollOutlinedIcon from "@mui/icons-material/PollOutlined";
import { Box, Tooltip } from "@mui/material";
import type { TaskCategory } from "@/lib/taskCategory";

interface TaskCategoryIconProps {
  category: TaskCategory;
  showTooltip?: boolean;
  fontSize?: number;
}

const iconSx = {
  color: "text.secondary",
  flexShrink: 0,
} as const;

const CATEGORY_ICON_COMPONENTS = {
  "ל״ע": MenuBookOutlinedIcon,
  סקרים: PollOutlinedIcon,
  "מטלת הגשה": AssignmentTurnedInOutlinedIcon,
  אחר: MoreHorizOutlinedIcon,
} as const;

export default function TaskCategoryIcon({
  category,
  showTooltip = true,
  fontSize = 16,
}: TaskCategoryIconProps) {
  const Icon = CATEGORY_ICON_COMPONENTS[category];
  const icon = (
    <Box
      component="span"
      sx={{ display: "inline-flex", lineHeight: 0, alignItems: "center" }}
      aria-label={category}
    >
      <Icon sx={{ ...iconSx, fontSize }} aria-hidden />
    </Box>
  );

  if (!showTooltip) {
    return icon;
  }

  return (
    <Tooltip title={category} enterDelay={400}>
      {icon}
    </Tooltip>
  );
}
