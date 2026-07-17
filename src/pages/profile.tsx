import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Typography,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import { clearSession, getSession } from "@/lib/authStorage";
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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      void router.replace("/");
      return;
    }

    void Promise.resolve().then(() => {
      setUser(session.user);
    });
  }, [router]);

  const handleLogout = () => {
    clearSession();
    void router.replace("/");
  };

  if (!user) {
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

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout user={user}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
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
            <Typography variant="h5" component="h1" align="center">
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
            color="error"
            size="large"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            התנתק
          </Button>
        </Container>
      </AppLayout>
    </>
  );
}
