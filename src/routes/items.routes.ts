import { Router, Response } from "express";
import { Filter, Sort } from "mongodb";
import { itemsCollection } from "../lib/db";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";
import { Item } from "../types";

const router = Router();

const calculateStatus = (
  quantity: number,
): "In Stock" | "Low Stock" | "Out of Stock" => {
  if (quantity === 0) return "Out of Stock";
  if (quantity < 10) return "Low Stock";
  return "In Stock";
};

// POST /api/items
router.post(
  "/",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, sku, category, quantity, unitPrice, location, imageUrl } =
        req.body;

      if (
        !name ||
        !sku ||
        !category ||
        quantity === undefined ||
        unitPrice === undefined
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const parsedQuantity = Number(quantity);
      const parsedUnitPrice = Number(unitPrice);

      // Ensure ownerName is explicitly converted to string
      const rawOwnerName = req.user?.name || req.user?.email || "Anonymous";
      const ownerNameStr =
        typeof rawOwnerName === "string" ? rawOwnerName : String(rawOwnerName);

      const newItem: Omit<Item, "_id"> = {
        name,
        sku,
        category,
        quantity: parsedQuantity,
        unitPrice: parsedUnitPrice,
        location: location || "",
        imageUrl: imageUrl || "",
        status: calculateStatus(parsedQuantity),
        ownerId: String(req.user?.id || req.user?.sub || "unknown"),
        ownerName: ownerNameStr,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await itemsCollection.insertOne(newItem as Item);

      return res.status(201).json({
        message: "Item created successfully",
        item: { _id: result.insertedId, ...newItem },
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to create item",
        details: (error as Error).message,
      });
    }
  },
);

// GET /api/items
router.get("/", async (req, res: Response) => {
  try {
    const {
      search,
      category,
      status,
      sort,
      page = "1",
      perPage = "10",
    } = req.query;

    const queryFilter: Filter<Item> = {};

    if (search && typeof search === "string" && search.trim() !== "") {
      queryFilter.name = { $regex: search.trim(), $options: "i" } as any;
    }

    if (category && typeof category === "string" && category.trim() !== "") {
      queryFilter.category = category.trim();
    }

    if (status && typeof status === "string" && status.trim() !== "") {
      queryFilter.status = status.trim() as Item["status"];
    }

    let sortOptions: Sort = { createdAt: -1 };

    if (sort === "price_asc") {
      sortOptions = { unitPrice: 1 };
    } else if (sort === "price_desc") {
      sortOptions = { unitPrice: -1 };
    } else if (sort === "oldest") {
      sortOptions = { createdAt: 1 };
    } else if (sort === "newest") {
      sortOptions = { createdAt: -1 };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(perPage) || 10);
    const skipNum = (pageNum - 1) * limitNum;

    const [items, totalItems] = await Promise.all([
      itemsCollection
        .find(queryFilter)
        .sort(sortOptions)
        .skip(skipNum)
        .limit(limitNum)
        .toArray(),
      itemsCollection.countDocuments(queryFilter),
    ]);

    return res.status(200).json({
      items,
      pagination: {
        totalItems,
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum),
        perPage: limitNum,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch items",
      details: (error as Error).message,
    });
  }
});

export default router;
