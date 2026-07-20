import LogoutIcon from "@mui/icons-material/Logout";
import { useColorMode } from "@/components/ColorModeProvider";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Switch,
  Typography,
} from "@mui/material";
import { formatPlatoonLabel } from "@/lib/platoons";
import { getRoleLabel } from "@/lib/roles";
import { getUserInitials } from "@/lib/userInitials";
import type { PublicUser } from "@/types/user";

function ProfileDetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1.5,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}

interface ProfilePanelProps {
  user: PublicUser;
  onLogout: () => void;
}

export default function ProfilePanel({ user, onLogout }: ProfilePanelProps) {
  const { mode, setMode } = useColorMode();

  return (
    <Box sx={{ px: 3, py: 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          mb: 4,
        }}
      >
        <Avatar
          sx={{
            width: 96,
            height: 96,
            bgcolor: "primary.main",
            fontSize: 36,
            fontWeight: 600,
          }}
        >
          {getUserInitials(user.fullname)}
        </Avatar>
        <Typography variant="h5" component="h2" align="center">
          {user.rank} {user.fullname}
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <ProfileDetailRow
          label="פלוגה"
          value={formatPlatoonLabel(user.platoon)}
        />
        <Divider />
        <ProfileDetailRow label="צוות" value={String(user.team)} />
        <Divider />
        <ProfileDetailRow label="תפקיד" value={getRoleLabel(user.role)} />
        <Divider />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            מצב כהה
          </Typography>
          <Switch
            checked={mode === "dark"}
            onChange={(_, checked) => setMode(checked ? "dark" : "light")}
            slotProps={{ input: { "aria-label": "מצב כהה" } }}
          />
        </Box>
      </Box>

      <Button
        fullWidth
        variant="outlined"
        color="error"
        size="large"
        startIcon={<LogoutIcon />}
        onClick={onLogout}
      >
        התנתק
      </Button>
    </Box>
  );
}
