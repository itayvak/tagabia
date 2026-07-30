import { useRouter } from "next/router";
import { Drawer, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ProfilePanel from "@/components/ProfilePanel";
import { clearSession } from "@/lib/authStorage";
import type { PublicUser } from "@/types/user";

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  user: PublicUser;
}

export default function ProfileDrawer({
  open,
  onClose,
  user,
}: ProfileDrawerProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    void router.replace("/");
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "min(100%, 360px)", sm: 360 },
          },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        aria-label="סגור פרופיל"
        sx={{ alignSelf: "flex-start", m: 1 }}
      >
        <CloseIcon />
      </IconButton>
      <ProfilePanel user={user} onLogout={handleLogout} />
    </Drawer>
  );
}
