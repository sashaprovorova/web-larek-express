import path from "path";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { errors } from "celebrate";
import productRouter from "./routes/product";
import orderRouter from "./routes/order";
import errorHandler from "./middlewares/error-handler";
import { requestLogger, errorLogger } from "./middlewares/logger";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = process.env.PORT;
const DB_ADDRESS = process.env.DB_ADDRESS;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(requestLogger);

app.use("/product", productRouter);
app.use("/order", orderRouter);

app.use(errorLogger);
app.use(errors());
app.use(errorHandler);

if (!DB_ADDRESS) {
  throw new Error("DB_ADDRESS environment variable is not defined");
}

mongoose
  .connect(DB_ADDRESS)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
