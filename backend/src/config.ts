import dotenv from "dotenv";
import path from "path";
import ms from "ms";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const PORT = Number(getEnv("PORT"));
export const DB_ADDRESS = getEnv("DB_ADDRESS");
export const ORIGIN = getEnv("ORIGIN_ALLOW");

export const UPLOAD_PATH = getEnv("UPLOAD_PATH");
export const UPLOAD_PATH_TEMP = getEnv("UPLOAD_PATH_TEMP");

export const ACCESS_SECRET = getEnv("ACCESS_JWT_SECRET");
export const REFRESH_SECRET = getEnv("REFRESH_JWT_SECRET");
export const ACCESS_EXPIRES = getEnv("AUTH_ACCESS_TOKEN_EXPIRY");
export const REFRESH_EXPIRES = getEnv("AUTH_REFRESH_TOKEN_EXPIRY");

export const REFRESH_MAX_AGE = ms(REFRESH_EXPIRES as ms.StringValue) as number;

export const COOKIE_SECURE = process.env.NODE_ENV === "production";
