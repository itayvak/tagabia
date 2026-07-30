import "@/styles/globals.css";
import { googleSans } from "@/lib/fonts";
import { rtlCache } from "@/lib/rtlCache";
import { theme } from "@/theme";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import type { EmotionCache } from "@emotion/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";

const APP_TITLE = "All In One";

type AppPropsWithCache = AppProps & {
  emotionCache?: EmotionCache;
};

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
        <meta
          name="description"
          content='מערכת לניהול משימות ותג"בים לצוער'
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <main>
          <Component {...pageProps} />
        </main>
      </ThemeProvider>
    </AppCacheProvider>
  );
}
