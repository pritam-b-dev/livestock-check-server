import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { connectDB, usersCollection, itemsCollection } from "../lib/db.js";
import type { Item } from "../types/index.js";

// Helper function: Compute status from quantity
const calculateStatus = (
  quantity: number,
): "In Stock" | "Low Stock" | "Out of Stock" => {
  if (quantity === 0) return "Out of Stock";
  if (quantity < 10) return "Low Stock";
  return "In Stock";
};

// 20 Combined seed items (Livestock + Office & Electronics)
const rawItemsData = [
  // --- Livestock Items ---
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

  // --- Office & Electronics Items ---
  {
    name: "Dell Latitude 5440 Laptop",
    sku: "DL-5440",
    category: "Electronics",
    quantity: 24,
    unitPrice: 950,
    location: "Warehouse A - Aisle 1",
    imageUrl: "https://picsum.photos/seed/DL-5440/500/400",
  },
  {
    name: "Logitech MX Master 3S Mouse",
    sku: "LG-MX3S",
    category: "Electronics",
    quantity: 60,
    unitPrice: 35,
    location: "Warehouse A - Aisle 1",
    imageUrl: "https://picsum.photos/seed/LG-MX3S/500/400",
  },
  {
    name: "HP LaserJet Pro M404 Printer",
    sku: "HP-M404",
    category: "Electronics",
    quantity: 5,
    unitPrice: 220,
    location: "Warehouse A - Aisle 2",
    imageUrl: "https://picsum.photos/seed/HP-M404/500/400",
  },
  {
    name: "USB-C Docking Station",
    sku: "DK-USBC1",
    category: "Electronics",
    quantity: 0,
    unitPrice: 75,
    location: "Warehouse A - Aisle 2",
    imageUrl: "https://picsum.photos/seed/DK-USBC1/500/400",
  },
  {
    name: "A4 Copy Paper (Ream)",
    sku: "OF-A4RM",
    category: "Office Supplies",
    quantity: 300,
    unitPrice: 3.5,
    location: "Main Office Storage",
    imageUrl: "https://picsum.photos/seed/OF-A4RM/500/400",
  },
  {
    name: "Heavy Duty Stapler",
    sku: "OF-STPL",
    category: "Office Supplies",
    quantity: 45,
    unitPrice: 8,
    location: "Main Office Storage",
    imageUrl: "https://picsum.photos/seed/OF-STPL/500/400",
  },
  {
    name: "Whiteboard 4x6 ft",
    sku: "OF-WB46",
    category: "Office Supplies",
    quantity: 8,
    unitPrice: 60,
    location: "Main Office Storage",
    imageUrl: "https://picsum.photos/seed/OF-WB46/500/400",
  },
  {
    name: "Ergonomic Office Chair",
    sku: "FN-ERGC",
    category: "Furniture",
    quantity: 12,
    unitPrice: 145,
    location: "Warehouse B - Floor 1",
    imageUrl: "https://picsum.photos/seed/FN-ERGC/500/400",
  },
  {
    name: "Standing Desk (Electric)",
    sku: "FN-SDSK",
    category: "Furniture",
    quantity: 3,
    unitPrice: 380,
    location: "Warehouse B - Floor 1",
    imageUrl: "https://picsum.photos/seed/FN-SDSK/500/400",
  },
  {
    name: "Steel Storage Rack",
    sku: "FN-RACK",
    category: "Furniture",
    quantity: 15,
    unitPrice: 95,
    location: "Warehouse B - Floor 2",
    imageUrl: "https://picsum.photos/seed/FN-RACK/500/400",
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting seed operation...");
    await connectDB();

    // পাসওয়ার্ড হ্যাশ তৈরি
    const demoPasswordHash = await bcrypt.hash("Demo@1234", 10);
    const adminPasswordHash = await bcrypt.hash("Admin@1234", 10);

    // ১. Ensure Demo User Exists & Has Password
    let demoUser = await usersCollection.findOne({
      email: "demo@livestockcheck.com",
    });

    if (!demoUser) {
      console.log("👤 Creating Demo User directly in DB...");
      const result = await usersCollection.insertOne({
        name: "Demo Manager",
        email: "demo@livestockcheck.com",
        password: demoPasswordHash,
        emailVerified: true,
        role: "user",
        plan: "free",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      demoUser = await usersCollection.findOne({ _id: result.insertedId });
    } else {
      await usersCollection.updateOne(
        { email: "demo@livestockcheck.com" },
        { $set: { password: demoPasswordHash } },
      );
    }

    // ২. Ensure Admin User Exists & Has Password
    let adminUser = await usersCollection.findOne({
      email: "admin@livestockcheck.com",
    });

    if (!adminUser) {
      console.log("👑 Creating Admin User directly in DB...");
      await usersCollection.insertOne({
        name: "System Admin",
        email: "admin@livestockcheck.com",
        password: adminPasswordHash,
        emailVerified: true,
        role: "admin",
        plan: "free",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await usersCollection.updateOne(
        { email: "admin@livestockcheck.com" },
        { $set: { role: "admin", password: adminPasswordHash } },
      );
    }

    if (!demoUser) {
      throw new Error("Failed to retrieve or create Demo User.");
    }

    const demoUserId = String(demoUser._id || demoUser.id);
    const demoUserName = (demoUser.name as string) || "Demo Manager";

    // ৩. Clear old items and insert fresh combined list
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
