import { ObjectId } from "mongodb";

export interface Item {
  _id?: ObjectId;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  location: string;
  imageUrl?: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  ownerId: string;
  ownerName: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
