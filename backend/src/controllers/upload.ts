import { NextFunction, Request, Response } from 'express';
import BadRequestError from '../errors/bad-request-error';

type UploadedFile = { filename: string; originalname: string };

export default function uploadFile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const file = (req as any).file as UploadedFile | undefined;

  if (!file) {
    return next(new BadRequestError('Файл не передан'));
  }

  return res.status(200).json({
    fileName: `/images/${file.filename}`,
    originalName: file.originalname,
  });
}
