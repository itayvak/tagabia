import localFont from "next/font/local";

// Self-hosted instead of next/font/google: Google serves Google Sans in 25 subsets
// and next/font downloads all of them on every cold compile, which times out on a
// slow connection and leaves the dev server printing "Retrying 1/3...".
// Run `npm run download:fonts` to refresh the .woff2 files in src/fonts.
//
// One localFont call per subset, each carrying the unicode-range Google ships for
// it, so the browser only fetches the file a given character actually needs.

const googleSansLatin = localFont({
  src: "../fonts/google-sans-latin.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

const googleSansLatinExt = localFont({
  src: "../fonts/google-sans-latin-ext.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

const googleSansHebrew = localFont({
  src: "../fonts/google-sans-hebrew.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F",
    },
  ],
});

export const delaGothicOne = localFont({
  src: "../fonts/dela-gothic-one-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
});

// Each subset is its own @font-face family, so they are listed in order and the
// browser resolves the right one per character.
export const googleSansFontFamily = [
  googleSansLatin,
  googleSansLatinExt,
  googleSansHebrew,
]
  .map((font) => font.style.fontFamily)
  .join(", ");
