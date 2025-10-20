import { Router } from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/products";
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateObjectIdParam,
} from "../middlewares/validations";

const router = Router();

router.get("/", getProducts);
router.post("/", validateCreateProduct, createProduct);
router.patch(
  "/:id",
  validateObjectIdParam("id"),
  validateUpdateProduct,
  updateProduct
);
router.delete("/:id", validateObjectIdParam("id"), deleteProduct);

export default router;
