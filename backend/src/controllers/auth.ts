import {
  Request, Response, CookieOptions, NextFunction,
} from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import UnauthorizedError from '../errors/auth-error';
import BadRequestError from '../errors/bad-request-error';
import ConflictError from '../errors/conflict-error';
import {
  ACCESS_SECRET,
  REFRESH_SECRET,
  ACCESS_EXPIRES,
  REFRESH_EXPIRES,
  REFRESH_MAX_AGE,
  COOKIE_SECURE,
} from '../config';

const cookie = {
  name: 'refreshToken',
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: COOKIE_SECURE,
    maxAge: REFRESH_MAX_AGE,
    path: '/',
  } as CookieOptions,
};

const toPublicUser = (user: any) => ({
  email: user.email,
  name: user.name || 'Ё-мое',
});

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;
  (User as any)
    .findUserByCredentials(email, password)
    .then((user: any) => {
      const accessToken = jwt.sign({ _id: user._id }, ACCESS_SECRET!, {
        expiresIn: ACCESS_EXPIRES! as jwt.SignOptions['expiresIn'],
      });
      const refreshToken = jwt.sign({ _id: user._id }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES! as jwt.SignOptions['expiresIn'],
      });

      user.tokens.push({ token: refreshToken });
      return user.save().then(() => {
        res.cookie(cookie.name, refreshToken, cookie.options);
        return res.status(200).json({
          user: toPublicUser(user),
          success: true,
          accessToken,
        });
      });
    })
    .catch(() => next(new UnauthorizedError('Неверные email или пароль')));
};

export const register = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  bcrypt
    .hash(password, 10)
    .then((hash) => User.create({
      name,
      email,
      password: hash,
      tokens: [],
    }))
    .then((user: any) => {
      const accessToken = jwt.sign({ _id: user._id }, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES! as jwt.SignOptions['expiresIn'],
      });
      const refreshToken = jwt.sign({ _id: user._id }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES! as jwt.SignOptions['expiresIn'],
      });

      user.tokens.push({ token: refreshToken });
      return user.save().then(() => {
        res.cookie(cookie.name, refreshToken, cookie.options);
        return res.status(200).json({
          user: toPublicUser(user),
          success: true,
          accessToken,
        });
      });
    })
    .catch((err: any) => {
      if (err?.message?.includes('E11000')) {
        return next(
          new ConflictError('Пользователь с таким email уже существует'),
        );
      }
      return next(
        new BadRequestError('Ошибка валидации данных при регистрации'),
      );
    });
};

export const refreshAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return next(new UnauthorizedError('Требуется авторизация'));
  }

  let payload: any;
  try {
    payload = jwt.verify(token, REFRESH_SECRET);
  } catch {
    return next(new UnauthorizedError('Невалидный refresh-токен'));
  }

  return (User as any)
    .findById(payload._id)
    .select('+tokens')
    .then((user: any) => {
      if (!user) {
        return next(new BadRequestError('Пользователь не найден'));
      }

      const tokenExists = user.tokens.some(
        (session: any) => session.token === token,
      );
      if (!tokenExists) {
        return next(new UnauthorizedError('Неверный refresh-токен'));
      }

      const newAccessToken = jwt.sign({ _id: user._id }, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES! as jwt.SignOptions['expiresIn'],
      });
      const newRefreshToken = jwt.sign({ _id: user._id }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES! as jwt.SignOptions['expiresIn'],
      });

      const updatedTokens = user.tokens.filter((t: any) => t.token !== token);
      updatedTokens.push({ token: newRefreshToken });
      user.set('tokens', updatedTokens);

      return user.save().then(() => {
        res.cookie(cookie.name, newRefreshToken, cookie.options);
        return res.status(200).json({
          user: toPublicUser(user),
          success: true,
          accessToken: newAccessToken,
        });
      });
    })
    .catch(() => next(new BadRequestError('Ошибка при обновлении токена')));
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    res.cookie(cookie.name, '', { ...cookie.options, maxAge: 0 });
    return res.status(200).json({ success: true });
  }

  let payload: any;
  try {
    payload = jwt.verify(token, REFRESH_SECRET);
  } catch {
    res.cookie(cookie.name, '', { ...cookie.options, maxAge: 0 });
    return res.status(200).json({ success: true });
  }

  return (User as any)
    .findById(payload._id)
    .select('+tokens')
    .then((user: any) => {
      if (!user) {
        return next(new BadRequestError('Пользователь не найден'));
      }

      const updatedTokens = user.tokens.filter((t: any) => t.token !== token);
      user.set('tokens', updatedTokens);

      return user.save().then(() => {
        res.cookie(cookie.name, '', { ...cookie.options, maxAge: 0 });
        return res.status(200).json({ success: true });
      });
    })
    .catch(() => next(new BadRequestError('Ошибка при выходе из системы')));
};

export const getCurrentUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = (req as any).user?._id;
  if (!userId) return next(new UnauthorizedError('Требуется авторизация'));

  return (User as any)
    .findById(userId)
    .then((user: any) => {
      if (!user) return next(new BadRequestError('Пользователь не найден'));
      return res.status(200).json({
        user: { email: user.email, name: user.name || 'Ё-мое' },
        success: true,
      });
    })
    .catch(() => next(new BadRequestError('Ошибка при получении пользователя')));
};
