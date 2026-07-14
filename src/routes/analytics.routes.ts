import { Router, Response } from "express";
import { itemsCollection, usersCollection } from "../lib/db.js";
import {
  verifyToken,
  AuthenticatedRequest,
} from "../middleware/verifyToken.js";

const router = Router();

// Helper Middleware: Verify Admin Role
const verifyAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: Function,
) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

// --------------------------------------------------------------------------
// GET /api/analytics/summary (Protected: verifyToken + Admin Only)
// --------------------------------------------------------------------------
router.get(
  "/summary",
  verifyToken,
  verifyAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 1. Total Users Count
      const totalUsersPromise = usersCollection.countDocuments();

      // 2. Total Items Count
      const totalItemsPromise = itemsCollection.countDocuments();

      // 3. Low Stock Items Count (quantity < 10)
      const lowStockCountPromise = itemsCollection.countDocuments({
        quantity: { $lt: 10 },
      });

      // 4. Total Stock Inventory Value (sum of quantity * unitPrice)
      const totalValueAggregationPromise = itemsCollection
        .aggregate([
          {
            $group: {
              _id: null,
              totalValue: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
            },
          },
        ])
        .toArray();

      // 5. Items Grouped by Category
      const byCategoryAggregationPromise = itemsCollection
        .aggregate([
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              category: "$_id",
              count: 1,
            },
          },
          { $sort: { count: -1 } },
        ])
        .toArray();

      // 6. Items Added Over Time (Last 30 Days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const addedOverTimeAggregationPromise = itemsCollection
        .aggregate([
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              date: "$_id",
              count: 1,
            },
          },
          { $sort: { date: 1 } },
        ])
        .toArray();

      // Execute all queries in parallel for maximum performance
      const [
        totalUsers,
        totalItems,
        lowStockCount,
        totalValueResult,
        byCategory,
        addedOverTime,
      ] = await Promise.all([
        totalUsersPromise,
        totalItemsPromise,
        lowStockCountPromise,
        totalValueAggregationPromise,
        byCategoryAggregationPromise,
        addedOverTimeAggregationPromise,
      ]);

      const totalValue =
        totalValueResult.length > 0 ? totalValueResult[0].totalValue : 0;

      return res.status(200).json({
        totalUsers,
        totalItems,
        totalValue,
        lowStockCount,
        byCategory,
        addedOverTime,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to fetch admin analytics summary",
        details: (error as Error).message,
      });
    }
  },
);

export default router;
