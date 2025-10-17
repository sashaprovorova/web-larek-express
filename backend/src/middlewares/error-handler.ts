import { NextFunction, Request, Response } from "express";

function errorHandler(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  const message = error?.message || "Внутренняя ошибка сервера";
  res.status(status).json({ message });
}

export default errorHandler;
