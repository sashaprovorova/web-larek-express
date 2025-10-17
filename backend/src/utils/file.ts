import fs from "fs/promises";
import path from "path";

const TEMP_DIR = path.join(
  __dirname,
  "..",
  "public",
  process.env.UPLOAD_PATH_TEMP || "temp"
);
const IMAGES_DIR = path.join(
  __dirname,
  "..",
  "public",
  process.env.UPLOAD_PATH || "images"
);

export async function ensureDirs() {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });
}

export async function moveFromTempToImages(fileName: string) {
  const base = path.basename(fileName);
  const from = path.join(TEMP_DIR, base);
  const to = path.join(IMAGES_DIR, base);
  await fs.rename(from, to).catch(async (e) => {
    if ((e as any).code === "EXDEV") {
      await fs.copyFile(from, to);
      await fs.unlink(from);
    } else {
      throw e;
    }
  });
  return `/images/${base}`;
}

export async function deleteIfExists(publicPath: string) {
  const isImages = publicPath.startsWith("/images/");
  const isTemp = publicPath.startsWith("/temp/");
  if (!isImages && !isTemp) return;

  const base = path.basename(publicPath);
  const dir = isImages ? IMAGES_DIR : TEMP_DIR;
  const full = path.join(dir, base);
  try {
    await fs.unlink(full);
  } catch {}
}
