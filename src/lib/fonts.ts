import { Dela_Gothic_One, Google_Sans } from "next/font/google";

export const googleSans = Google_Sans({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-google-sans",
  adjustFontFallback: false,
});

export const delaGothicOne = Dela_Gothic_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
