import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./lib/db";
import { auth } from "./lib/auth";

// Route Imports
import itemsRouter from "./routes/items.routes";
import paymentRouter from "./routes/payment.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Express 5 compatible mount for BetterAuth routes
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "OK", message: "LiveStock Check API Server is running" });
});

// Mount /api Routes
app.use("/api/items", itemsRouter);
app.use("/api/payment", paymentRouter);

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
