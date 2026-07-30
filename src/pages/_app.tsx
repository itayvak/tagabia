import "@/styles/globals.css";
import { googleSans } from "@/lib/fonts";
import { rtlCache } from "@/lib/rtlCache";
import { theme } from "@/theme";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import { Box, CircularProgress, CssBaseline, ThemeProvider } from "@mui/material";
import type { EmotionCache } from "@emotion/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import { useEffect, useState, type ReactNode } from "react";
import { getSession } from "@/lib/authStorage";
import { getUserHomePath, isCommanderAllowedPage } from "@/lib/appRoutes";

const APP_TITLE = "All In One";

type AppPropsWithCache = AppProps & {
  emotionCache?: EmotionCache;
};

function RoleRouteGuard({ children }: { children: ReactNode }) {
  const { isReady, pathname } = useRouter();
  const [checkedRoute, setCheckedRoute] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      const session = getSession();
      let destination: string | null = null;

      if (pathname === "/commander") {
        destination = session ? getUserHomePath(session.user) : "/";
        if (session?.user.role === "commander") {
          destination = null;
        }
      } else if (
        session?.user.role === "commander" &&
        !isCommanderAllowedPage(pathname)
      ) {
        destination = "/commander";
      }

      if (destination) {
        void Router.replace(destination);
        return;
      }

      setCheckedRoute(pathname);
    });

    return () => {
      cancelled = true;
    };
  }, [isReady, pathname]);

  if (!isReady || checkedRoute !== pathname) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return children;
}

export default function App({
  Component,
  pageProps,
  emotionCache = rtlCache,
}: AppPropsWithCache) {
  useEffect(() => {
    document.documentElement.classList.add(googleSans.variable);
    return () => {
      document.documentElement.classList.remove(googleSans.variable);
    };
  }, []);

  return (
    <AppCacheProvider emotionCache={emotionCache}>
      <Head>
        <title>{APP_TITLE}</title>
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <main>
          <RoleRouteGuard>
            <Component {...pageProps} />
          </RoleRouteGuard>
        </main>
      </ThemeProvider>
    </AppCacheProvider>
  );
}
