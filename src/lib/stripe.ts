import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error(
    "Please define the STRIPE_SECRET_KEY environment variable inside .env",
  );
}

// Stripe SDK Initialization with updated API version
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-06-24.dahlia" as any, // TypeScript error/warning এড়াতে dynamically string pass
  typescript: true,
});

// Price Config Map for Subscription Plans
export const PLAN_PRICE_ID = {
  growth: process.env.STRIPE_GROWTH_PRICE_ID || "",
  business: process.env.STRIPE_BUSINESS_PRICE_ID || "",
} as const;

export type PlanType = keyof typeof PLAN_PRICE_ID;
