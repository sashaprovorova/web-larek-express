import ms from "ms";
import { Request, Response, CookieOptions } from "express";
import User from "../models/user";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ACCESS_SECRET = (process.env.ACCESS_JWT_SECRET = "dev-access-secret");
const REFRESH_SECRET = (process.env.REFRESH_JWT_SECRET = "dev-refresh-secret");
const ACCESS_EXPIRES = (process.env.AUTH_ACCESS_TOKEN_EXPIRY = "10m");
const REFRESH_EXPIRES = (process.env.AUTH_REFRESH_TOKEN_EXPIRY = "7d");

const REFRESH_MAX_AGE = ms(REFRESH_EXPIRES as ms.StringValue) as number;

const cookie = {
  name: "refreshToken",
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    maxAge: REFRESH_MAX_AGE,
    path: "/",
  } as CookieOptions,
};

const toPublicUser = (user: any) => ({
  email: user.email,
  name: user.name || "Ё-мое",
});

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  (User as any)
    .findUserByCredentials(email, password)
    .then((user: any) => {
      const accessToken = jwt.sign({ _id: user._id }, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES,
      });
      const refreshToken = jwt.sign({ _id: user._id }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES,
      });

      user.tokens.push({ token: refreshToken });
      return user.save().then(() => {
        res.cookie(cookie.name, refreshToken, cookie.options);
        res.status(200).json({
          user: toPublicUser(user),
          success: true,
          accessToken,
        });
      });
    })
    .catch(() =>
      res.status(401).json({ message: "Неверные email или пароль" })
    );
};

export const register = (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  bcrypt
    .hash(password, 10)
    .then((hash) => User.create({ name, email, password: hash, tokens: [] }))
    .then((user: any) => {
      const accessToken = jwt.sign({ _id: user._id }, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES,
      });
      const refreshToken = jwt.sign({ _id: user._id }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES,
      });

      user.tokens.push({ token: refreshToken });
      return user.save().then(() => {
        res.cookie(cookie.name, refreshToken, cookie.options);
        res.status(200).json({
          user: toPublicUser(user),
          success: true,
          accessToken,
        });
      });
    })
    .catch((err) => {
      if (err.message.includes("E11000")) {
        return res
          .status(409)
          .json({ message: "Пользователь с таким email уже существует" });
      }
      res
        .status(400)
        .json({ message: "Ошибка валидации данных при регистрации" });
    });
};

export const refreshAccessToken = (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }

  let payload: any;
  try {
    payload = jwt.verify(token, REFRESH_SECRET);
  } catch {
    return res.status(401).json({ message: "Невалидный refresh-токен" });
  }

  (User as any)
    .findById(payload._id)
    .select("+tokens")
    .then((user: any) => {
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const tokenExists = user.tokens.some((t: any) => t.token === token);
      if (!tokenExists) {
        return res.status(401).json({ message: "Неверный refresh-токен" });
      }

      const newAccessToken = jwt.sign({ _id: user._id }, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES,
      });
      const newRefreshToken = jwt.sign({ _id: user._id }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES,
      });

      user.tokens = user.tokens.filter((t: any) => t.token !== token);
      user.tokens.push({ token: newRefreshToken });

      return user.save().then(() => {
        res.cookie(cookie.name, newRefreshToken, cookie.options);
        res.status(200).json({
          user: toPublicUser(user),
          success: true,
          accessToken: newAccessToken,
        });
      });
    })
    .catch(() =>
      res.status(500).json({ message: "Ошибка при обновлении токена" })
    );
};

export const logout = (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    res.cookie(cookie.name, "", { ...cookie.options, maxAge: 0 });
    return res.status(200).json({ success: true });
  }

  let payload: any;
  try {
    payload = jwt.verify(token, REFRESH_SECRET);
  } catch {
    res.cookie(cookie.name, "", { ...cookie.options, maxAge: 0 });
    return res.status(200).json({ success: true });
  }

  (User as any)
    .findById(payload._id)
    .select("+tokens")
    .then((user: any) => {
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      user.tokens = user.tokens.filter((t: any) => t.token !== token);

      return user.save().then(() => {
        res.cookie(cookie.name, "", { ...cookie.options, maxAge: 0 });
        res.status(200).json({ success: true });
      });
    })
    .catch(() =>
      res.status(500).json({ message: "Ошибка при выходе из системы" })
    );
};

export const getCurrentUser = (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId)
    return res.status(401).json({ message: "Требуется авторизация" });

  (User as any)
    .findById(userId)
    .then((user: any) => {
      if (!user)
        return res.status(404).json({ message: "Пользователь не найден" });
      return res.status(200).json({
        user: { email: user.email, name: user.name || "Ё-мое" },
        success: true,
      });
    })
    .catch(() =>
      res.status(500).json({ message: "Ошибка при получении пользователя" })
    );
};
