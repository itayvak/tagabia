import "@/styles/globals.css";
import { googleSans } from "@/lib/fonts";
import { rtlCache } from "@/lib/rtlCache";
import { theme } from "@/theme";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import type { EmotionCache } from "@emotion/react";
import type { AppProps } from "next/app";
import { useEffect } from "react";

type AppPropsWithCache = AppProps & {
  emotionCache?: EmotionCache;
};

export default function App({
  Component,
  pageProps,
  emotionCache,
}: AppPropsWithCache) {
  useEffect(() => {
    document.documentElement.classList.add(googleSans.variable);
    return () => {
      document.documentElement.classList.remove(googleSans.variable);
    };
  }, []);

  return (
    <AppCacheProvider emotionCache={emotionCache ?? rtlCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <main>
          <Component {...pageProps} />
        </main>
      </ThemeProvider>
    </AppCacheProvider>
  );
}
