import { createTheme } from "@mui/material";
import { googleSans } from "@/lib/fonts";

export const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: `${googleSans.style.fontFamily}, "Segoe UI", Arial, sans-serif`,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          pointerEvents: "none",
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          pointerEvents: "auto",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          pointerEvents: "auto",
        },
      },
    },
  },
});
