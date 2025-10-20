import { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import NotFoundError from '../errors/not-found-error';
import ConflictError from '../errors/conflict-error';
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
      if (err instanceof Error && err.message.includes('E11000')) {
        return next(
          new ConflictError(
            'Ресурс с таким уникальным значением уже существует',
          ),
        );
      }
      return next(err as Error);
    });
};

export const updateProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const update = req.body;

  Product.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    .orFail(new NotFoundError('Товар не найден'))
    .then((updatedProduct) => res.status(200).send(updatedProduct))
    .catch((err: unknown) => {
      const e = err as Error;
      if (e instanceof Error && e.message.includes('E11000')) {
        return next(
          new ConflictError('Товар с таким названием уже существует'),
        );
      }
      if (
        err instanceof MongooseError.CastError
        || err instanceof MongooseError.ValidationError
      ) {
        return next(
          new BadRequestError('Ошибка валидации данных при обновлении товара'),
        );
      }
      return next(e);
    });
};

export const deleteProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  Product.findByIdAndDelete(id)
    .orFail(new NotFoundError('Товар не найден'))
    .then((doc) => res.status(200).send(doc))
    .catch((err: unknown) => {
      if (err instanceof MongooseError.CastError) {
        return next(new BadRequestError('Невалидный идентификатор товара'));
      }
      return next(err as Error);
    });
};
