import { createEmotionCache } from "@mui/material-nextjs/v16-pagesRouter";
import rtlPlugin from "@mui/stylis-plugin-rtl";
import { prefixer } from "stylis";

export const rtlCache = createEmotionCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});
