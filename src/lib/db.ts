import { MongoClient, Db, Collection } from "mongodb";
import dotenv from "dotenv";
import type { Item } from "../types";
dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env",
  );
}

export const client = new MongoClient(uri);

export const db = client.db("livestock-check");

// Collections
export const usersCollection: Collection = db.collection("users");
export const sessionCollection: Collection = db.collection("sessions");
export const itemsCollection: Collection<Item> = db.collection<Item>("items");
export const subscriptionsCollection: Collection =
  db.collection("subscriptions");

export async function connectDB(): Promise<Db> {
  await client.connect();
  console.log("Connected to MongoDB database: livestock-check");
  return db;
}
