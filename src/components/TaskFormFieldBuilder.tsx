import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { TaskFormFieldInput, TaskFormFieldType } from "@/types/taskForm";

export interface BuilderFormField extends TaskFormFieldInput {
  clientKey: string;
}

interface TaskFormFieldBuilderProps {
  fields: BuilderFormField[];
  onChange: (fields: BuilderFormField[]) => void;
  disabled?: boolean;
}

function createEmptyField(): BuilderFormField {
  return {
    clientKey: crypto.randomUUID(),
    type: "text",
    label: "",
    required: false,
    order: 0,
  };
}

function validateBuilderFields(fields: BuilderFormField[]): string | null {
  for (const field of fields) {
    if (!field.label.trim()) {
      return "יש להזין תווית לכל שדה בטופס";
    }

    if (field.type === "multipleChoice" || field.type === "multiSelect") {
      const options = (field.options ?? [])
        .map((option) => option.trim())
        .filter((option) => option.length > 0);

      if (options.length < 2) {
        return "שדה בחירה חייב לכלול לפחות שתי אפשרויות";
      }
    }
  }

  return null;
}

export function toBuilderFormFields(
  fields: TaskFormFieldInput[],
): BuilderFormField[] {
  return fields.map((field, index) => ({
    ...field,
    clientKey: field.id ?? crypto.randomUUID(),
    order: index,
  }));
}

export function toFormFieldInputs(
  fields: BuilderFormField[],
): TaskFormFieldInput[] {
  return fields.map((field, index) => ({
    id: field.id,
    type: field.type,
    label: field.label.trim(),
    required: field.required,
    order: index,
    options:
      field.type === "multipleChoice" || field.type === "multiSelect"
        ? (field.options ?? [])
            .map((option) => option.trim())
            .filter((option) => option.length > 0)
        : undefined,
  }));
}

export { validateBuilderFields };

export default function TaskFormFieldBuilder({
  fields,
  onChange,
  disabled = false,
}: TaskFormFieldBuilderProps) {
  const updateField = (
    clientKey: string,
    updater: (field: BuilderFormField) => BuilderFormField,
  ) => {
    onChange(
      fields.map((field) =>
        field.clientKey === clientKey ? updater(field) : field,
      ),
    );
  };

  const handleAddField = () => {
    onChange([...fields, createEmptyField()]);
  };

  const handleRemoveField = (clientKey: string) => {
    onChange(fields.filter((field) => field.clientKey !== clientKey));
  };

  const handleTypeChange = (
    clientKey: string,
    type: TaskFormFieldType | null,
  ) => {
    if (!type) {
      return;
    }

    updateField(clientKey, (field) => {
      if (type === "multipleChoice" || type === "multiSelect") {
        return {
          ...field,
          type,
          options:
            (field.type === "multipleChoice" || field.type === "multiSelect") &&
            field.options
              ? field.options
              : ["", ""],
        };
      }

      const nextField = { ...field, type };
      delete nextField.options;
      return nextField;
    });
  };

  const handleOptionChange = (
    clientKey: string,
    optionIndex: number,
    value: string,
  ) => {
    updateField(clientKey, (field) => {
      const options = [...(field.options ?? [])];
      options[optionIndex] = value;
      return { ...field, options };
    });
  };

  const handleAddOption = (clientKey: string) => {
    updateField(clientKey, (field) => ({
      ...field,
      options: [...(field.options ?? []), ""],
    }));
  };

  const handleRemoveOption = (clientKey: string, optionIndex: number) => {
    updateField(clientKey, (field) => ({
      ...field,
      options: (field.options ?? []).filter((_, index) => index !== optionIndex),
    }));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography variant="subtitle1">שדות טופס (אופציונלי)</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddField}
          disabled={disabled}
        >
          הוסף שדה
        </Button>
      </Box>

      {fields.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          ניתן להוסיף שדות טקסט, בחירה יחידה או בחירה מרובה שהממונים ימלאו לפני
          סימון המטלה כבוצעה.
        </Typography>
      ) : null}

      {fields.map((field, index) => (
        <Card key={field.clientKey} variant="outlined">
          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography variant="subtitle2">שדה {index + 1}</Typography>
              <IconButton
                aria-label="הסר שדה"
                onClick={() => handleRemoveField(field.clientKey)}
                disabled={disabled}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={field.type}
              onChange={(_event, value: TaskFormFieldType | null) =>
                handleTypeChange(field.clientKey, value)
              }
              disabled={disabled}
              fullWidth
            >
              <ToggleButton value="text">טקסט חופשי</ToggleButton>
              <ToggleButton value="multipleChoice">בחירה יחידה</ToggleButton>
              <ToggleButton value="multiSelect">בחירה מרובה</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="כותרת השדה"
              value={field.label}
              onChange={(event) =>
                updateField(field.clientKey, (current) => ({
                  ...current,
                  label: event.target.value,
                }))
              }
              required
              fullWidth
              disabled={disabled}
              slotProps={{
                htmlInput: { dir: "rtl" },
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={field.required}
                  onChange={(event) =>
                    updateField(field.clientKey, (current) => ({
                      ...current,
                      required: event.target.checked,
                    }))
                  }
                  disabled={disabled}
                />
              }
              label="שדה חובה"
            />

            {field.type === "multipleChoice" || field.type === "multiSelect" ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  אפשרויות
                </Typography>
                {(field.options ?? []).map((option, optionIndex) => (
                  <Box
                    key={`${field.clientKey}-option-${optionIndex}`}
                    sx={{ display: "flex", gap: 1, alignItems: "center" }}
                  >
                    <TextField
                      label={`אפשרות ${optionIndex + 1}`}
                      value={option}
                      onChange={(event) =>
                        handleOptionChange(
                          field.clientKey,
                          optionIndex,
                          event.target.value,
                        )
                      }
                      fullWidth
                      disabled={disabled}
                      slotProps={{
                        htmlInput: { dir: "rtl" },
                      }}
                    />
                    <IconButton
                      aria-label="הסר אפשרות"
                      onClick={() =>
                        handleRemoveOption(field.clientKey, optionIndex)
                      }
                      disabled={disabled || (field.options?.length ?? 0) <= 2}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddOption(field.clientKey)}
                  disabled={disabled}
                  sx={{ alignSelf: "flex-start" }}
                >
                  הוסף אפשרות
                </Button>
              </Box>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
