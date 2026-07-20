import { createTheme, type PaletteMode } from "@mui/material";
import { googleSans } from "@/lib/fonts";

const baseTheme = {
  direction: "rtl" as const,
  typography: {
    fontFamily: `${googleSans.style.fontFamily}, "Segoe UI", Arial, sans-serif`,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
};

export function getTheme(mode: PaletteMode) {
  return createTheme({
    ...baseTheme,
    palette: {
      mode,
    },
  });
}
