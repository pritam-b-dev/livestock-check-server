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

const client = new MongoClient(uri);

let db: Db;

export let usersCollection: Collection;
export let sessionCollection: Collection;
export let itemsCollection: Collection<Item>;
export let subscriptionsCollection: Collection;

export async function connectDB(): Promise<Db> {
  if (!db) {
    await client.connect();
    db = client.db("livestock-check");

    usersCollection = db.collection("users");
    sessionCollection = db.collection("sessions");
    itemsCollection = db.collection<Item>("items");
    subscriptionsCollection = db.collection("subscriptions");

    console.log("Connected to MongoDB database: livestock-check");
  }
  return db;
}
