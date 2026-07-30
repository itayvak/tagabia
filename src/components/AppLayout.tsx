import { Box } from "@mui/material";
import AppBottomBar, { APP_BOTTOM_BAR_HEIGHT } from "@/components/AppBottomBar";
import type { PublicUser } from "@/types/user";

interface AppLayoutProps {
  user: PublicUser;
  children: React.ReactNode;
}

export default function AppLayout({ user, children }: AppLayoutProps) {
  const showBottomBar = user.role !== "commander";

  return (
    <>
      <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            pb: showBottomBar ? `${APP_BOTTOM_BAR_HEIGHT + 16}px` : 0,
          }}
        >
          {children}
        </Box>
      </Box>
      {showBottomBar ? <AppBottomBar user={user} /> : null}
    </>
  );
}
