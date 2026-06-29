import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import {
  parseMultiSelectValue,
  serializeMultiSelectValue,
} from "@/lib/taskFormValidation";
import type { TaskFormField } from "@/types/taskForm";

interface TaskFormRendererProps {
  fields: TaskFormField[];
  answers: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  disabled?: boolean;
}

export default function TaskFormRenderer({
  fields,
  answers,
  onChange,
  disabled = false,
}: TaskFormRendererProps) {
  if (fields.length === 0) {
    return null;
  }

  const handleMultiSelectToggle = (
    fieldId: string,
    option: string,
    checked: boolean,
  ) => {
    const current = parseMultiSelectValue(answers[fieldId] ?? "");
    const next = checked
      ? [...current, option]
      : current.filter((value) => value !== option);

    onChange(fieldId, serializeMultiSelectValue(next));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {fields.map((field) => {
        const label = field.required ? `${field.label} *` : field.label;
        const value = answers[field.id] ?? "";

        if (field.type === "multiSelect") {
          const selected = parseMultiSelectValue(value);

          return (
            <FormControl key={field.id} disabled={disabled} fullWidth>
              <FormLabel sx={{ mb: 1 }}>{label}</FormLabel>
              <FormGroup>
                {(field.options ?? []).map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={selected.includes(option)}
                        onChange={(event) =>
                          handleMultiSelectToggle(
                            field.id,
                            option,
                            event.target.checked,
                          )
                        }
                      />
                    }
                    label={option}
                  />
                ))}
              </FormGroup>
            </FormControl>
          );
        }

        if (field.type === "multipleChoice") {
          return (
            <FormControl key={field.id} disabled={disabled} fullWidth>
              <FormLabel sx={{ mb: 1 }}>{label}</FormLabel>
              <RadioGroup
                value={value}
                onChange={(event) => onChange(field.id, event.target.value)}
              >
                {(field.options ?? []).map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          );
        }

        return (
          <TextField
            key={field.id}
            label={label}
            value={value}
            onChange={(event) => onChange(field.id, event.target.value)}
            required={field.required}
            fullWidth
            disabled={disabled}
            multiline
            minRows={2}
            slotProps={{
              htmlInput: { dir: "rtl" },
            }}
          />
        );
      })}

      {!disabled ? (
        <Typography variant="caption" color="text.secondary">
          יש למלא את כל שדות החובה לפני סימון המטלה כבוצעה.
        </Typography>
      ) : null}
    </Box>
  );
}
