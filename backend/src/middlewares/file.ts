import path from "path";
import fs from "fs";
import multer from "multer";

const TEMP_DIR = path.join(
  __dirname,
  "..",
  "public",
  process.env.UPLOAD_PATH_TEMP || "temp"
);

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const allowed = [
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base =
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    cb(null, base + ext);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Недопустимый тип файла"));
  }
  return cb(null, true);
};

const fileMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default fileMiddleware;
