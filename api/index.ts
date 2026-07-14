import app from "../src/index";
import { connectDB } from "../src/lib/db";

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Database Connection Failed:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not connect to MongoDB database",
    });
  }
}
