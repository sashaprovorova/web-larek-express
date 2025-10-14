import { Request, Response, NextFunction } from 'express';
import { faker } from '@faker-js/faker';
import Product from '../models/product';
import BadRequestError from '../errors/bad-request-error';

const createOrder = (req: Request, res: Response, next: NextFunction) => {
  const { total, items } = req.body;

  return Product.find({ _id: { $in: items } })
    .then((docs) => {
      if (docs.length !== items.length) {
        throw new BadRequestError('Один или несколько товаров не найдены');
      }

      if (
        docs.some(
          (products) => products.price === null || typeof products.price !== 'number',
        )
      ) {
        throw new BadRequestError(
          'Один или несколько товаров не продаются (price = null)',
        );
      }

      const sum = docs.reduce(
        (acc, product) => acc + (product.price as number),
        0,
      );
      if (sum !== total) {
        throw new BadRequestError(
          'Поле total не совпадает с суммой цен товаров',
        );
      }

      return res.status(201).send({ id: faker.string.uuid(), total: sum });
    })
    .catch(next);
};

export default createOrder;
