// Downloads the woff2 files backing src/lib/fonts.ts.
//
// The fonts used to come from next/font/google, but Google serves Google Sans in
// 25 subsets and next/font downloads every one of them on each cold compile
// (`subsets` only controls preloading). In dev each request gets a 3s timeout, so
// on a slow or NAT'd connection they time out and the dev server spins on
// "Retrying 1/3...". Self-hosting the four subsets we actually use removes the
// network from the compile path entirely.
//
// Run `npm run download:fonts` to refresh the files, then check them in.

import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FONTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "fonts",
);

// Chrome UA so the Google Fonts API answers with woff2 instead of ttf.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36";

const FONTS = [
  {
    prefix: "google-sans",
    cssUrl:
      "https://fonts.googleapis.com/css2?family=Google+Sans:opsz,wght@17..18,400..700&display=swap",
    subsets: ["latin", "latin-ext", "hebrew"],
  },
  {
    prefix: "dela-gothic-one",
    cssUrl:
      "https://fonts.googleapis.com/css2?family=Dela+Gothic+One:wght@400&display=swap",
    subsets: ["latin"],
  },
];

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers: { "User-Agent": USER_AGENT } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`GET ${url} -> ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });

    req.setTimeout(30_000, () => req.destroy(new Error(`GET ${url} timed out`)));
    req.on("error", reject);
    req.end();
  });
}

/** Google Fonts writes the subset name in a comment above each @font-face block. */
function parseFontFaces(css) {
  const faces = [];
  let subset = "";

  for (const line of css.split("\n")) {
    const comment = /\/\* (.+?) \*\//.exec(line);
    if (comment) {
      subset = comment[1];
      continue;
    }

    const src = /src: url\((.+?)\)/.exec(line);
    if (src) {
      faces.push({ subset, url: src[1] });
      continue;
    }

    const unicodeRange = /unicode-range: (.+?);/.exec(line);
    if (unicodeRange && faces.length > 0) {
      faces[faces.length - 1].unicodeRange = unicodeRange[1];
    }
  }

  return faces;
}

async function main() {
  await fs.mkdir(FONTS_DIR, { recursive: true });

  for (const font of FONTS) {
    const faces = parseFontFaces((await get(font.cssUrl)).toString("utf8"));

    for (const subset of font.subsets) {
      const face = faces.find((candidate) => candidate.subset === subset);
      if (!face) {
        throw new Error(`${font.prefix}: no "${subset}" subset in ${font.cssUrl}`);
      }

      // Sequential on purpose: parallel fetches to fonts.gstatic.com are what
      // made next/font unreliable here in the first place.
      const file = `${font.prefix}-${subset}.woff2`;
      await fs.writeFile(path.join(FONTS_DIR, file), await get(face.url));
      console.log(`${file}  unicode-range: ${face.unicodeRange ?? "(none)"}`);
    }
  }
}

await main();
