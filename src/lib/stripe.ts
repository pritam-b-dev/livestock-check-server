import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("Please define STRIPE_SECRET_KEY in environment variables");
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2023-10-16" as any,
});
