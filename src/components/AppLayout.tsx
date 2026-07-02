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
      <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <AppTopBar user={user} />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            pb: `${APP_BOTTOM_BAR_HEIGHT + 16}px`,
          }}
        >
          {children}
        </Box>
      </Box>
      <AppBottomBar user={user} />
    </>
  );
}
