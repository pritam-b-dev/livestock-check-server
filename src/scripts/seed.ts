import { connectDB } from "../lib/db";

async function seed() {
  try {
    console.log("Seeding LiveStock Check database...");
    const db = await connectDB();

    const seedItems = [
      {
        name: "Dell Latitude 5440 Laptop",
        sku: "DL-5440",
        category: "Electronics",
        quantity: 24,
        unitPrice: 950,
        location: "Warehouse A - Aisle 1",
        imageUrl: "https://picsum.photos/seed/DL-5440/500/400",
        createdAt: new Date(),
      },
      {
        name: "Logitech MX Master 3S Mouse",
        sku: "LG-MX3S",
        category: "Electronics",
        quantity: 60,
        unitPrice: 35,
        location: "Warehouse A - Aisle 1",
        imageUrl: "https://picsum.photos/seed/LG-MX3S/500/400",
        createdAt: new Date(),
      },
      {
        name: "HP LaserJet Pro M404 Printer",
        sku: "HP-M404",
        category: "Electronics",
        quantity: 5,
        unitPrice: 220,
        location: "Warehouse A - Aisle 2",
        imageUrl: "https://picsum.photos/seed/HP-M404/500/400",
        createdAt: new Date(),
      },
      {
        name: "USB-C Docking Station",
        sku: "DK-USBC1",
        category: "Electronics",
        quantity: 0,
        unitPrice: 75,
        location: "Warehouse A - Aisle 2",
        imageUrl: "https://picsum.photos/seed/DK-USBC1/500/400",
        createdAt: new Date(),
      },
      {
        name: "A4 Copy Paper (Ream)",
        sku: "OF-A4RM",
        category: "Office Supplies",
        quantity: 300,
        unitPrice: 3.5,
        location: "Main Office Storage",
        imageUrl: "https://picsum.photos/seed/OF-A4RM/500/400",
        createdAt: new Date(),
      },
      {
        name: "Heavy Duty Stapler",
        sku: "OF-STPL",
        category: "Office Supplies",
        quantity: 45,
        unitPrice: 8,
        location: "Main Office Storage",
        imageUrl: "https://picsum.photos/seed/OF-STPL/500/400",
        createdAt: new Date(),
      },
      {
        name: "Whiteboard 4x6 ft",
        sku: "OF-WB46",
        category: "Office Supplies",
        quantity: 8,
        unitPrice: 60,
        location: "Main Office Storage",
        imageUrl: "https://picsum.photos/seed/OF-WB46/500/400",
        createdAt: new Date(),
      },
      {
        name: "Ergonomic Office Chair",
        sku: "FN-ERGC",
        category: "Furniture",
        quantity: 12,
        unitPrice: 145,
        location: "Warehouse B - Floor 1",
        imageUrl: "https://picsum.photos/seed/FN-ERGC/500/400",
        createdAt: new Date(),
      },
      {
        name: "Standing Desk (Electric)",
        sku: "FN-SDSK",
        category: "Furniture",
        quantity: 3,
        unitPrice: 380,
        location: "Warehouse B - Floor 1",
        imageUrl: "https://picsum.photos/seed/FN-SDSK/500/400",
        createdAt: new Date(),
      },
      {
        name: "Steel Storage Rack",
        sku: "FN-RACK",
        category: "Furniture",
        quantity: 15,
        unitPrice: 95,
        location: "Warehouse B - Floor 2",
        imageUrl: "https://picsum.photos/seed/FN-RACK/500/400",
        createdAt: new Date(),
      },
    ];

    await db.collection("items").deleteMany({});
    const result = await db.collection("items").insertMany(seedItems);

    console.log(
      `Successfully seeded ${result.insertedCount} items into LiveStock Check database.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seed();
