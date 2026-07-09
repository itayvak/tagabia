import { useRouter } from "next/router";
import { Box, Button, Typography } from "@mui/material";
import { clearSession } from "@/lib/authStorage";
import type { PublicUser } from "@/types/user";
import { formatPlatoonLabel } from "@/lib/platoons";
import { canManageTasks, getRoleLabel } from "@/lib/roles";

interface AppTopBarProps {
  user: PublicUser;
}

export default function AppTopBar({ user }: AppTopBarProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    void router.replace("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="body2" color="text.secondary">
          {user.rank} {user.fullname}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          פלוגת {formatPlatoonLabel(user.platoon)}, צוות {user.team}
        </Typography>
        {canManageTasks(user.role) && (
          <Typography variant="caption" color="text.secondary">
            {getRoleLabel(user.role)}
          </Typography>
        )}
      </Box>
      <Button size="small" variant="outlined" onClick={handleLogout}>
        התנתק
      </Button>
    </Box>
  );
}
