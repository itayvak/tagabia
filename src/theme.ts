import { createTheme } from "@mui/material";
import { googleSansFontFamily } from "@/lib/fonts";

export const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: `${googleSansFontFamily}, "Segoe UI", Arial, sans-serif`,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});
