import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./lib/db";

import itemRoutes from "./routes/items.routes";
import paymentRoutes from "./routes/payment.routes";
import analyticsRoutes from "./routes/analytics.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/items", itemRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "LiveStock Check Server" });
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(
        `LiveStock Check backend running on http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("Failed to start LiveStock Check server:", error);
    process.exit(1);
  }
}

startServer();
