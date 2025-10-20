import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { errors } from "celebrate";
import productRouter from "./routes/product";
import orderRouter from "./routes/order";
import errorHandler from "./middlewares/error-handler";
import { requestLogger, errorLogger } from "./middlewares/logger";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import uploadRouter from "./routes/upload";
import { ensureDirs } from "./utils/file";
import path from "path";
import { PORT, DB_ADDRESS, ORIGIN } from "./config";

const app = express();
app.use(
  cors({
    origin: ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(requestLogger);

ensureDirs().catch(() => {});

app.use("/auth", authRouter);
app.use("/upload", uploadRouter);
app.use("/product", productRouter);
app.use("/order", orderRouter);

app.use(errorLogger);
app.use(errors());
app.use(errorHandler);

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
