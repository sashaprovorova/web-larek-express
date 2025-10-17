import { NextFunction, Request, Response } from 'express';
import { Error } from 'mongoose';
import BadRequestError from '../errors/bad-request-error';
import ConflictError from '../errors/conflict-error';
import NotFoundError from '../errors/not-found-error';

function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof Error && error.message.includes('E11000')) {
    const err = new ConflictError(
      'Ресурс с таким уникальным значением уже существует',
    );
    return res.status(err.statusCode).json({ message: err.message });
  }
  if (
    error instanceof BadRequestError
    || error instanceof ConflictError
    || error instanceof NotFoundError
  ) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
}

export default errorHandler;
