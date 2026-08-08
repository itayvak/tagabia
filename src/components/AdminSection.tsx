import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";

interface AdminSectionProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

export default function AdminSection({ icon, title, children }: AdminSectionProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}
