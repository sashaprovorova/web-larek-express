import { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import Product from '../models/product';
import BadRequestError from '../errors/bad-request-error';

export const getProducts = (_req: Request, res: Response, next: NextFunction) => Product.find({})
  .then((products) => res.status(200).send({ items: products, total: products.length }))
  .catch((err) => next(err));

export const createProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    title, image, category, description, price,
  } = req.body;

  return Product.create({
    title,
    image,
    category,
    description,
    price,
  })
    .then((product) => res.status(201).send(product))
    .catch((err) => {
      if (err instanceof MongooseError.ValidationError) {
        return next(
          new BadRequestError('Ошибка валидации данных при создании товара'),
        );
      }
      return next(err as Error);
    });
};
