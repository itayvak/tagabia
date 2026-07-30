import { Box } from "@mui/material";
import AppBottomBar, { appBottomOffset } from "@/components/AppBottomBar";
import type { PublicUser } from "@/types/user";

interface AppLayoutProps {
  user: PublicUser;
  children: React.ReactNode;
}

export default function AppLayout({ user, children }: AppLayoutProps) {
  return (
    <>
      <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            pb: appBottomOffset(16),
          }}
        >
          {children}
        </Box>
      </Box>
      <AppBottomBar user={user} />
    </>
  );
}
