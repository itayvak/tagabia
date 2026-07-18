import { useState } from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import TaskCategoryIcon from "@/components/TaskCategoryIcon";
import {
  TASK_CATEGORIES,
  TASK_CATEGORY_DESCRIPTIONS,
  type TaskCategory,
} from "@/lib/taskCategory";

interface TaskCategoryPickerProps {
  value: TaskCategory | null;
  onChange: (category: TaskCategory) => void;
  disabled?: boolean;
  autoOpen?: boolean;
  requireSelection?: boolean;
}

export default function TaskCategoryPicker({
  value,
  onChange,
  disabled = false,
  autoOpen = false,
  requireSelection = false,
}: TaskCategoryPickerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(autoOpen);

  const handleSelect = (category: TaskCategory) => {
    onChange(category);
    setIsDialogOpen(false);
  };

  const handleDialogClose = () => {
    if (requireSelection && !value) {
      return;
    }

    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        fullWidth
        disabled={disabled}
        onClick={() => setIsDialogOpen(true)}
        endIcon={<ArrowDropDownIcon />}
        sx={{
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          textAlign: "right",
          color: value ? "text.primary" : "text.secondary",
          borderColor: value ? "divider" : "warning.main",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: 1,
            minWidth: 0,
          }}
        >
          {value ? <TaskCategoryIcon category={value} showTooltip={false} /> : null}
          <Typography variant="body2" sx={{ fontWeight: value ? 600 : 500 }}>
            {value ?? "בחר קטגוריה"}
          </Typography>
        </Box>
      </Button>
      <Dialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>בחר קטגוריה</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pb: 2 }}>
          {TASK_CATEGORIES.map((option) => {
            const isSelected = option === value;

            return (
              <Button
                key={option}
                type="button"
                variant={isSelected ? "contained" : "outlined"}
                onClick={() => handleSelect(option)}
                sx={{
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  textAlign: "start",
                  px: 2,
                  py: 1.5,
                  gap: 1.5,
                }}
              >
                <Box sx={{ pt: 0.25, flexShrink: 0 }}>
                  <TaskCategoryIcon category={option} showTooltip={false} fontSize={24} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" component="span" sx={{ display: "block" }}>
                    {option}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      opacity: isSelected ? 0.95 : 0.8,
                      whiteSpace: "normal",
                    }}
                  >
                    {TASK_CATEGORY_DESCRIPTIONS[option]}
                  </Typography>
                </Box>
              </Button>
            );
          })}
        </DialogContent>
      </Dialog>
    </>
  );
}
