import { Router, Response } from "express";
import { Filter, Sort, ObjectId } from "mongodb";
import { itemsCollection } from "../lib/db.js";
import {
  verifyToken,
  AuthenticatedRequest,
} from "../middleware/verifyToken.js";
import type { Item } from "../types/index.js";

const router = Router();

// Helper 1: Calculate stock status server-side
const calculateStatus = (
  quantity: number,
): "In Stock" | "Low Stock" | "Out of Stock" => {
  if (quantity === 0) return "Out of Stock";
  if (quantity < 10) return "Low Stock";
  return "In Stock";
};

// Helper 2: Check if current user is owner of the item or has admin role
const isOwnerOrAdmin = (
  user: AuthenticatedRequest["user"],
  item: Item,
): boolean => {
  if (!user) return false;
  const userId = String(user.id || user.sub || "");
  const isAdmin = user.role === "admin";
  const isOwner = String(item.ownerId) === userId;

  return isOwner || isAdmin;
};

// Helper 3: Safely extract single string ID from Express req.params
const getIdParam = (idParam: string | string[]): string => {
  return Array.isArray(idParam) ? idParam[0] : idParam;
};

// --------------------------------------------------------------------------
// 1. GET /api/items/mine (Protected: verifyToken)
// --------------------------------------------------------------------------
router.get(
  "/mine",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = String(req.user?.id || req.user?.sub || "");

      if (!userId) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Missing user information" });
      }

      const userItems = await itemsCollection
        .find({ ownerId: userId })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json(userItems);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to fetch user items",
        details: (error as Error).message,
      });
    }
  },
);

// --------------------------------------------------------------------------
// 2. GET /api/items (PUBLIC: Explore Page List)
// --------------------------------------------------------------------------
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

// --------------------------------------------------------------------------
// 3. GET /api/items/:id (PUBLIC: Full item details)
// --------------------------------------------------------------------------
router.get("/:id", async (req, res: Response) => {
  try {
    const id = getIdParam(req.params.id);

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Item ID format" });
    }

    const item = await itemsCollection.findOne({
      _id: new ObjectId(id) as any,
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch item details",
      details: (error as Error).message,
    });
  }
});

// --------------------------------------------------------------------------
// 4. POST /api/items (Protected: verifyToken - Create Item with strict validation)
// --------------------------------------------------------------------------
router.post(
  "/",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, sku, category, quantity, unitPrice, location, imageUrl } =
        req.body;

      // Validation 1: Required fields
      if (!name || typeof name !== "string" || name.trim() === "") {
        return res
          .status(400)
          .json({ error: "Item name is required and cannot be empty." });
      }

      if (!sku || !category) {
        return res.status(400).json({
          error: "Missing required fields: sku and category are required.",
        });
      }

      // Validation 2: Quantity and unitPrice non-negative check
      const parsedQuantity = Number(quantity);
      const parsedUnitPrice = Number(unitPrice);

      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        return res
          .status(400)
          .json({ error: "Quantity must be a valid non-negative number." });
      }

      if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
        return res
          .status(400)
          .json({ error: "Unit price must be a valid non-negative number." });
      }

      const rawOwnerName = req.user?.name || req.user?.email || "Anonymous";
      const ownerNameStr =
        typeof rawOwnerName === "string" ? rawOwnerName : String(rawOwnerName);

      const newItem: Omit<Item, "_id"> = {
        name: name.trim(),
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

// --------------------------------------------------------------------------
// 5. PATCH /api/items/:id (Protected: verifyToken + isOwnerOrAdmin check + validation)
// --------------------------------------------------------------------------
router.patch(
  "/:id",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = getIdParam(req.params.id);

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid Item ID format" });
      }

      const existingItem = await itemsCollection.findOne({
        _id: new ObjectId(id) as any,
      });

      if (!existingItem) {
        return res.status(404).json({ error: "Item not found" });
      }

      if (!isOwnerOrAdmin(req.user, existingItem)) {
        return res.status(403).json({
          error: "Forbidden: You do not have permission to update this item",
        });
      }

      const updateData: Partial<Item> = { ...req.body };
      delete updateData._id;
      delete updateData.ownerId;

      // Validation for update fields
      if (updateData.name !== undefined) {
        if (
          typeof updateData.name !== "string" ||
          updateData.name.trim() === ""
        ) {
          return res.status(400).json({ error: "Item name cannot be empty." });
        }
        updateData.name = updateData.name.trim();
      }

      if (updateData.quantity !== undefined) {
        const newQuantity = Number(updateData.quantity);
        if (isNaN(newQuantity) || newQuantity < 0) {
          return res
            .status(400)
            .json({ error: "Quantity must be a valid non-negative number." });
        }
        updateData.quantity = newQuantity;
        updateData.status = calculateStatus(newQuantity);
      }

      if (updateData.unitPrice !== undefined) {
        const newUnitPrice = Number(updateData.unitPrice);
        if (isNaN(newUnitPrice) || newUnitPrice < 0) {
          return res
            .status(400)
            .json({ error: "Unit price must be a valid non-negative number." });
        }
        updateData.unitPrice = newUnitPrice;
      }

      updateData.updatedAt = new Date();

      await itemsCollection.updateOne(
        { _id: new ObjectId(id) as any },
        { $set: updateData },
      );

      const updatedItem = await itemsCollection.findOne({
        _id: new ObjectId(id) as any,
      });

      return res.status(200).json({
        message: "Item updated successfully",
        item: updatedItem,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to update item",
        details: (error as Error).message,
      });
    }
  },
);

// --------------------------------------------------------------------------
// 6. DELETE /api/items/:id (Protected: verifyToken + isOwnerOrAdmin check)
// --------------------------------------------------------------------------
router.delete(
  "/:id",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = getIdParam(req.params.id);

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid Item ID format" });
      }

      const existingItem = await itemsCollection.findOne({
        _id: new ObjectId(id) as any,
      });

      if (!existingItem) {
        return res.status(404).json({ error: "Item not found" });
      }

      if (!isOwnerOrAdmin(req.user, existingItem)) {
        return res.status(403).json({
          error: "Forbidden: You do not have permission to delete this item",
        });
      }

      await itemsCollection.deleteOne({ _id: new ObjectId(id) as any });

      return res.status(200).json({
        message: "Item deleted successfully",
        deletedId: id,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to delete item",
        details: (error as Error).message,
      });
    }
  },
);

export default router;
