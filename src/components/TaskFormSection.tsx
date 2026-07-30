import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { useState, type ReactNode } from "react";

interface TaskFormSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export default function TaskFormSection({
  title,
  defaultExpanded = false,
  children,
}: TaskFormSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Accordion
      disableGutters
      variant="outlined"
      expanded={expanded}
      onChange={(_event, isExpanded) => setExpanded(isExpanded)}
      sx={{
        "&:before": { display: "none" },
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "background.paper",
        boxShadow: 1,
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" component="span">
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{ pt: 0, display: "flex", flexDirection: "column", gap: 2 }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
