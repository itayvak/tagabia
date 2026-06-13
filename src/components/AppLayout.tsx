import { Box } from "@mui/material";
import AppBottomBar, { APP_BOTTOM_BAR_HEIGHT } from "@/components/AppBottomBar";
import AppTopBar from "@/components/AppTopBar";
import type { PublicUser } from "@/types/user";

interface AppLayoutProps {
  user: PublicUser;
  children: React.ReactNode;
}

export default function AppLayout({ user, children }: AppLayoutProps) {
  return (
    <>
      <AppTopBar user={user} />
      <Box sx={{ pb: `${APP_BOTTOM_BAR_HEIGHT + 16}px` }}>{children}</Box>
      <AppBottomBar user={user} />
    </>
  );
}
