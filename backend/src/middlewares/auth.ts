import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UnauthorizedError from '../errors/auth-error';
import { ACCESS_SECRET } from '../config';

export default function auth(req: Request, _res: Response, next: NextFunction) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Требуется авторизация'));
  }
  const token = authorization.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as unknown as {
      _id: string;
    };
    (req as any).user = payload;
    return next();
  } catch {
    return next(new UnauthorizedError('Невалидный access-токен'));
  }
}
