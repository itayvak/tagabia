import { Box } from "@mui/material";
import AppBottomBar, { appBottomOffset } from "@/components/AppBottomBar";
import type { PublicUser } from "@/types/user";

interface AppLayoutProps {
  user: PublicUser;
  children: React.ReactNode;
  contentBgColor?: string;
}

export default function AppLayout({
  user,
  children,
  contentBgColor,
}: AppLayoutProps) {
  const showBottomBar = user.role !== "commander";

  return (
    <>
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          bgcolor: contentBgColor,
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            pb: showBottomBar ? appBottomOffset(16) : 0,
            bgcolor: contentBgColor,
          }}
        >
          {children}
        </Box>
      </Box>
      {showBottomBar ? <AppBottomBar user={user} /> : null}
    </>
  );
}
