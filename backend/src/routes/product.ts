import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/products';
import auth from '../middlewares/auth';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateObjectIdParam,
} from '../middlewares/validations';

const router = Router();

router.get('/', getProducts);
router.post('/', auth, validateCreateProduct, createProduct);
router.patch(
  '/:id',
  auth,
  validateObjectIdParam('id'),
  validateUpdateProduct,
  updateProduct,
);
router.delete('/:id', auth, validateObjectIdParam('id'), deleteProduct);

export default router;
