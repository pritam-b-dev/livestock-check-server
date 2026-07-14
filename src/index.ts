/**
 * ============================================================================
 * DEPLOYMENT REMINDER:
 * ============================================================================
 * After deploying this backend (e.g., Render, Railway, Vercel):
 * 1. Update environment variables in your hosting provider:
 *    - BETTER_AUTH_URL = <your-deployed-backend-url>
 *    - CLIENT_URL      = <your-deployed-frontend-url>
 * 2. Go to Google Cloud Console (APIs & Services > Credentials):
 *    - Add <your-deployed-backend-url>/api/auth/callback/google
 *      to Authorized Redirect URIs.
 * ============================================================================
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./lib/db";
import { auth } from "./lib/auth";

// Route Imports
import itemsRouter from "./routes/items.routes";
import paymentRouter from "./routes/payment.routes";
import analyticsRouter from "./routes/analytics.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS origin handling for production & development
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, "http://localhost:3000"]
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// BetterAuth Handler
app.all("/api/auth/*", toNodeHandler(auth));

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
app.use("/api/analytics", analyticsRouter);

// Catch-all 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Centralized Error Logged:", err.stack || err.message);

  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred on the server.",
  });
});

// Local Development Server Starter
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error: unknown) => {
      console.error("Failed to start local server:", error);
    });
}

// Export express app for Vercel Serverless
export default app;
