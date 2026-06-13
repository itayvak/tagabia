import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  PLATOONS,
  countAssigneeTargets,
  formatPlatoonLabel,
  getAssigneeSummaryItems,
  getTeamsForPlatoon,
  hasAssigneeSelection,
  type AssigneeSelection,
} from "@/lib/platoons";
import type { Platoon } from "@/types/user";

interface TaskAssigneePickerProps {
  selection: AssigneeSelection;
  onChange: (selection: AssigneeSelection) => void;
  assigneeCount: number | null;
  isResolving: boolean;
  disabled?: boolean;
}

export default function TaskAssigneePicker({
  selection,
  onChange,
  assigneeCount,
  isResolving,
  disabled = false,
}: TaskAssigneePickerProps) {
  const summaryItems = getAssigneeSummaryItems(selection);
  const targetCount = countAssigneeTargets(selection);
  const hasSelection = hasAssigneeSelection(selection);

  const handleEntirePlatoonChange = (platoon: Platoon, checked: boolean) => {
    const platoonTeams = getTeamsForPlatoon(platoon);

    onChange({
      ...selection,
      [platoon]: {
        entirePlatoon: checked,
        teams: checked ? platoonTeams : [],
      },
    });
  };

  const handleTeamChange = (
    platoon: Platoon,
    team: number,
    checked: boolean,
  ) => {
    const platoonTeams = getTeamsForPlatoon(platoon);
    const platoonSelection = selection[platoon];
    const teams = checked
      ? [...new Set([...platoonSelection.teams, team])]
      : platoonSelection.teams.filter((value) => value !== team);

    onChange({
      ...selection,
      [platoon]: {
        entirePlatoon: teams.length === platoonTeams.length,
        teams,
      },
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="subtitle2">שיוך לחיילים</Typography>

      {PLATOONS.map((platoon) => {
        const platoonSelection = selection[platoon];
        const platoonTeams = getTeamsForPlatoon(platoon);
        const hasSelection =
          platoonSelection.entirePlatoon || platoonSelection.teams.length > 0;

        return (
          <Accordion
            key={platoon}
            disableGutters
            variant="outlined"
            disabled={disabled}
            sx={{
              "&:before": { display: "none" },
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: hasSelection ? 600 : 400,
                  color: hasSelection ? "text.primary" : "text.secondary",
                }}
              >
                פלוגת {formatPlatoonLabel(platoon)}
                {hasSelection && !platoonSelection.entirePlatoon && (
                  <> · {platoonSelection.teams.length} צוותים</>
                )}
                {platoonSelection.entirePlatoon && <> · כל הפלוגה</>}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={platoonSelection.entirePlatoon}
                      onChange={(event) =>
                        handleEntirePlatoonChange(platoon, event.target.checked)
                      }
                      disabled={disabled}
                    />
                  }
                  label="כל הפלוגה"
                />
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                    pr: 1,
                  }}
                >
                  {platoonTeams.map((team) => (
                    <FormControlLabel
                      key={team}
                      control={
                        <Checkbox
                          size="small"
                          checked={platoonSelection.teams.includes(team)}
                          onChange={(event) =>
                            handleTeamChange(
                              platoon,
                              team,
                              event.target.checked,
                            )
                          }
                          disabled={disabled || platoonSelection.entirePlatoon}
                        />
                      }
                      label={`צוות ${team}`}
                    />
                  ))}
                </Box>
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {!hasSelection
            ? "לא נבחרו חיילים"
            : isResolving
              ? "מחשב כמה חיילים יקבלו את המטלה..."
              : assigneeCount === null
                ? `${targetCount} קבוצות נבחרו`
                : `${assigneeCount} חיילים יקבלו את המטלה`}
        </Typography>
        {summaryItems.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {summaryItems.map((item) => (
              <Chip key={item} label={item} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
