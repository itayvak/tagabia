import FeedbackIcon from "@mui/icons-material/Feedback";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Typography,
} from "@mui/material";
import { formatPlatoonLabel } from "@/lib/platoons";
import { getRoleLabel } from "@/lib/roles";
import { getUserInitials } from "@/lib/userInitials";
import type { PublicUser } from "@/types/user";

const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSc6QOkRktlo0b812z-NUpECznByQnEcp5AAS4481z2kjJnhIw/viewform?usp=publish-editor";

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
      </Box>

      <Button
        fullWidth
        variant="outlined"
        size="large"
        startIcon={<FeedbackIcon />}
        component="a"
        href={FEEDBACK_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ mb: 2 }}
      >
       משוב על המערכת
      </Button>

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
