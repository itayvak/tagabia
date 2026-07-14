import { Google_Sans } from "next/font/google";

export const googleSans = Google_Sans({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-google-sans",
  adjustFontFallback: false,
});
