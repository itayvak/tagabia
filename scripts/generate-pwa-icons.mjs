import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "public/bahad1.png");
const OUT_DIR = path.join(ROOT, "public/icons");
const BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

async function createIcon(size, logoScale, filename) {
  const logoSize = Math.round(size * logoScale);
  const logo = await sharp(SOURCE)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(path.join(OUT_DIR, filename));

  const meta = await sharp(path.join(OUT_DIR, filename)).metadata();
  console.log(`Created ${filename} (${meta.width}x${meta.height})`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

await createIcon(192, 0.92, "icon-192x192.png");
await createIcon(512, 0.92, "icon-512x512.png");
await createIcon(512, 0.68, "icon-512x512-maskable.png");
await createIcon(180, 0.92, "apple-touch-icon.png");
await createIcon(152, 0.92, "apple-touch-icon-152x152.png");
await createIcon(167, 0.92, "apple-touch-icon-167x167.png");
