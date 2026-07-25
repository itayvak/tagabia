import { Box } from "@mui/material";
import AppBottomBar, {
  APP_BOTTOM_BAR_HEIGHT,
  APP_BOTTOM_BAR_SAFE_AREA,
} from "@/components/AppBottomBar";
import type { PublicUser } from "@/types/user";

interface AppLayoutProps {
  user: PublicUser;
  children: React.ReactNode;
}

export default function AppLayout({ user, children }: AppLayoutProps) {
  return (
    <>
      <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            display: "flex",
            flexDirection: "column",
            pb: `calc(${APP_BOTTOM_BAR_HEIGHT + 16}px + ${APP_BOTTOM_BAR_SAFE_AREA})`,
          }}
        >
          {children}
        </Box>
      </Box>
      <AppBottomBar user={user} />
    </>
  );
}
