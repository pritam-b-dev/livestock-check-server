import dotenv from "dotenv";
dotenv.config();

import { ObjectId } from "mongodb";
import { connectDB, usersCollection, itemsCollection } from "../lib/db";
import { Item } from "../types";

// Helper function: Compute status from quantity
const calculateStatus = (
  quantity: number,
): "In Stock" | "Low Stock" | "Out of Stock" => {
  if (quantity === 0) return "Out of Stock";
  if (quantity < 10) return "Low Stock";
  return "In Stock";
};

// 10 Seed items
const rawItemsData = [
  {
    name: "Cattle Feed Premium 50kg",
    sku: "FEED-CAT-001",
    category: "Feed & Nutrition",
    quantity: 45,
    unitPrice: 28.5,
    location: "Warehouse A - Shelf 3",
    imageUrl:
      "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Automatic Poultry Waterer",
    sku: "EQUIP-POUL-002",
    category: "Equipment",
    quantity: 8,
    unitPrice: 15.99,
    location: "Warehouse B - Rack 1",
    imageUrl:
      "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Livestock Antibiotic Spray 500ml",
    sku: "MED-LIV-003",
    category: "Medicine & Health",
    quantity: 0,
    unitPrice: 12.0,
    location: "Cabinet C - Lock 2",
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Milking Machine Component Kit",
    sku: "EQUIP-DAI-004",
    category: "Equipment",
    quantity: 18,
    unitPrice: 145.0,
    location: "Warehouse A - Section 5",
    imageUrl:
      "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Sheep & Goat Vitamin Supplement 1kg",
    sku: "FEED-SUP-005",
    category: "Feed & Nutrition",
    quantity: 5,
    unitPrice: 22.3,
    location: "Warehouse A - Shelf 1",
    imageUrl:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Electric Fence Insulators Pack (50pcs)",
    sku: "FENC-ELE-006",
    category: "Fencing & Shelter",
    quantity: 60,
    unitPrice: 34.99,
    location: "Warehouse C - Bin 12",
    imageUrl:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Ear Tags for Cattle (Numbered 1-100)",
    sku: "TAG-CAT-007",
    category: "Identification",
    quantity: 3,
    unitPrice: 18.5,
    location: "Cabinet B - Drawer 1",
    imageUrl:
      "https://images.unsplash.com/photo-1545468843-27956a3a7ef3?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Digital Livestock Weight Scale",
    sku: "EQUIP-SCL-008",
    category: "Equipment",
    quantity: 12,
    unitPrice: 299.99,
    location: "Showroom Main Floor",
    imageUrl:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Dehorning Wire with Handles",
    sku: "TOOL-DEH-009",
    category: "Tools & Hardware",
    quantity: 0,
    unitPrice: 9.75,
    location: "Warehouse B - Bin 4",
    imageUrl:
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Organic Hay Bale Premium Grade",
    sku: "FEED-HAY-010",
    category: "Feed & Nutrition",
    quantity: 120,
    unitPrice: 8.0,
    location: "Barn 2 - Storage Bay",
    imageUrl:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=400",
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting seed operation...");
    await connectDB();

    // 1. Ensure Demo User Exists
    let demoUser = await usersCollection.findOne({
      email: "demo@stockify.com",
    });

    if (!demoUser) {
      console.log("👤 Creating Demo User directly in DB...");
      const result = await usersCollection.insertOne({
        name: "Demo Manager",
        email: "demo@stockify.com",
        emailVerified: true,
        role: "user",
        plan: "free",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      demoUser = await usersCollection.findOne({ _id: result.insertedId });
    }

    // 2. Ensure Admin User Exists
    let adminUser = await usersCollection.findOne({
      email: "admin@stockify.com",
    });

    if (!adminUser) {
      console.log("👑 Creating Admin User directly in DB...");
      await usersCollection.insertOne({
        name: "System Admin",
        email: "admin@stockify.com",
        emailVerified: true,
        role: "admin",
        plan: "free",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await usersCollection.updateOne(
        { email: "admin@stockify.com" },
        { $set: { role: "admin" } },
      );
    }

    if (!demoUser) {
      throw new Error("Failed to retrieve or create Demo User.");
    }

    const demoUserId = String(demoUser._id || demoUser.id);
    const demoUserName = (demoUser.name as string) || "Demo Manager";

    // 3. Insert items
    await itemsCollection.deleteMany({});

    const formattedItems: Item[] = rawItemsData.map((item) => ({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      location: item.location,
      imageUrl: item.imageUrl,
      status: calculateStatus(item.quantity),
      ownerId: demoUserId,
      ownerName: demoUserName,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await itemsCollection.insertMany(formattedItems);

    console.log(
      `🎉 Success: Seeded ${result.insertedCount} items linked to user (${demoUserName})!`,
    );
    console.log("🚪 Closing process...");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seedDatabase();
