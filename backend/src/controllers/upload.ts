import { Request, Response } from "express";

export const uploadFile = (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ message: "Файл не передан" });
  }

  return res.status(200).json({
    fileName: `/images/${file.filename}`,
    originalName: file.originalname,
  });
};
