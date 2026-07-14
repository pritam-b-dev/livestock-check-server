import { Router } from "express";
import { getDB } from "../lib/db";
import { verifyToken } from "../middleware/verifyToken";
import { verifyRole } from "../middleware/verifyRole";

const router = Router();

// Get all inventory items
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const items = await db.collection("items").find().toArray();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory items" });
  }
});

// Add new inventory item (Admin/Manager only)
router.post(
  "/",
  verifyToken,
  verifyRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const db = getDB();
      const newItem = { ...req.body, createdAt: new Date() };
      const result = await db.collection("items").insertOne(newItem);
      res.status(201).json({ id: result.insertedId, ...newItem });
    } catch (error) {
      res.status(500).json({ error: "Failed to create item" });
    }
  },
);

export default router;
