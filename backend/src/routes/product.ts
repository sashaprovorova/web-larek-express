import { Router } from 'express';
import { getProducts, createProduct } from '../controllers/products';
import { validateCreateProduct } from '../middlewares/validations';

const router = Router();

router.get('/', getProducts);
router.post('/', validateCreateProduct, createProduct);

export default router;
