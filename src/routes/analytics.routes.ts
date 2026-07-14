import { Router } from "express";
import { getDB } from "../lib/db";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

router.get("/summary", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const totalItems = await db.collection("items").countDocuments();

    res.json({
      appName: "LiveStock Check",
      totalItems,
      systemStatus: "Optimal",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve analytics" });
  }
});

export default router;
