import path from "path";
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
import dotenv from "dotenv";
dotenv.config();

const { PORT = 3000, DB_ADDRESS = "mongodb://127.0.0.1:27017/weblarek" } =
  process.env;
const ORIGIN = process.env.ORIGIN_ALLOW || "http://localhost:5173";
const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

ensureDirs().catch(() => {});

mongoose.connect(DB_ADDRESS);

app.use(express.static(path.join(__dirname, "public")));

app.use(requestLogger);
app.use("/auth", authRouter);
app.use("/upload", uploadRouter);

app.use("/product", productRouter);
app.use("/order", orderRouter);

app.use(errorLogger);

app.use(errors());
app.use(errorHandler);

app.listen(PORT, () => {});
