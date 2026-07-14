import { Request } from "express";

export interface UserPayload {
  id: string;
  email: string;
  role: "admin" | "user" | "manager";
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface InventoryItem {
  _id?: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  location: string;
  imageUrl: string;
  createdAt: Date;
}
