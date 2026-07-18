import { useRouter } from "next/router";
import { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    void router.replace("/allTasks?profile=open");
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress />
    </Box>
  );
}
