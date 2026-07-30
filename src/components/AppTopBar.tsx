import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Container,
  IconButton,
  Typography,
} from "@mui/material";
import { fetchCourseConfig } from "@/lib/fetchCourseConfig";
import { getCurrentWeek } from "@/lib/courseWeek";
import { delaGothicOne } from "@/lib/fonts";
import { getDailySplashQuote } from "@/lib/splashQuotes";
import { getUserInitials } from "@/lib/userInitials";
import type {
  GetCourseConfigSuccessResponse,
  PublicCourseConfig,
} from "@/types/courseConfig";
import type { PublicUser } from "@/types/user";

const APP_TITLE = "All In One";

interface AppTopBarProps {
  user: PublicUser;
  onProfileOpen: () => void;
}

function AppTitle() {
  return (
    <Typography
      variant="h5"
      component="h1"
      dir="ltr"
      sx={{
        color: "common.white",
        fontFamily: delaGothicOne.style.fontFamily,
        textAlign: "center",
        width: "100%",
      }}
    >
      {APP_TITLE}
    </Typography>
  );
}

export default function AppTopBar({ user, onProfileOpen }: AppTopBarProps) {
  const [courseConfig, setCourseConfig] = useState<PublicCourseConfig | null>(
    null,
  );

  useEffect(() => {
    const loadCourseConfig = async () => {
      try {
        const { response, data } = await fetchCourseConfig();

        if (!response.ok) {
          return;
        }

        setCourseConfig((data as GetCourseConfigSuccessResponse).config);
      } catch {
        // Keep the week subtitle hidden when config cannot be loaded.
      }
    };

    void loadCourseConfig();
  }, []);

  const currentWeek = useMemo(
    () => getCurrentWeek(courseConfig),
    [courseConfig],
  );
  const dailyQuote = getDailySplashQuote();

  return (
    <Box
      sx={{
        ...(currentWeek
          ? {
              backgroundImage: `
                    linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
                    url(${currentWeek.image})
                  `,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}),
        mb: 2,
      }}
    >
      <Container maxWidth="sm" sx={{ py: 3, position: "relative" }}>
        <IconButton
          onClick={onProfileOpen}
          aria-label="פתח פרופיל"
          sx={{
            position: "absolute",
            top: 24,
            insetInlineStart: 16,
            p: 0,
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "primary.main",
              fontSize: 16,
              fontWeight: 600,
              border: "2px solid",
              borderColor: "common.white",
            }}
          >
            {getUserInitials(user.fullname)}
          </Avatar>
        </IconButton>
        <Box
          component="img"
          src="/bahad1.png"
          alt="בה״ד 1"
          sx={{
            position: "absolute",
            top: 24,
            insetInlineEnd: 16,
            width: 40,
            height: 40,
          }}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            textAlign: "center",
            width: "100%",
          }}
        >
          <AppTitle />
          {currentWeek ? (
            <Typography
              variant="body2"
              sx={{ color: "grey.100", textAlign: "center" }}
            >
              {currentWeek.name}
            </Typography>
          ) : null}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "baseline",
              gap: 0.75,
            }}
          >
            <Typography variant="body2" sx={{ color: "grey.100" }}>
              &ldquo;{dailyQuote.text}&rdquo;
            </Typography>
            {dailyQuote.author ? (
              <Typography variant="caption" sx={{ color: "grey.300" }}>
                - {dailyQuote.author}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
