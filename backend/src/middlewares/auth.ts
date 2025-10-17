import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_JWT_SECRET || "dev-access-secret";

export default function auth(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }
  const token = authorization.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as { _id: string };
    (req as any).user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Невалидный access-токен" });
  }
}
