import path from "path";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import productRouter from "./routes/product";
import orderRouter from "./routes/order";
import errorHandler from "./middlewares/error-handler";
import { errors } from "celebrate";
import { requestLogger, errorLogger } from "./middlewares/logger";

const { PORT = 3000, DB_ADDRESS = "mongodb://127.0.0.1:27017/weblarek" } =
  process.env;
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(DB_ADDRESS);

app.use(express.static(path.join(__dirname, "public")));

app.use(requestLogger);

app.use("/product", productRouter);
app.use("/order", orderRouter);

app.use(errorLogger);

app.use(errors());
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
