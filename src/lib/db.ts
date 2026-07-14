import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const client = new MongoClient(uri);
let dbInstance: Db;

export async function connectDB(): Promise<Db> {
  if (dbInstance) return dbInstance;

  await client.connect();
  console.log("Connected to LiveStock Check MongoDB database");
  dbInstance = client.db();
  return dbInstance;
}

export function getDB(): Db {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return dbInstance;
}
