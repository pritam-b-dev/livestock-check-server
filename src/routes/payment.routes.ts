import { Router, Response } from "express";
import { ObjectId } from "mongodb";
import { stripe, PLAN_PRICE_ID, PlanType } from "../lib/stripe.js";
import {
  verifyToken,
  AuthenticatedRequest,
} from "../middleware/verifyToken.js";
import { usersCollection } from "../lib/db.js";

const router = Router();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// --------------------------------------------------------------------------
// 1. POST /api/payment/create-checkout-session (Protected: verifyToken)
// --------------------------------------------------------------------------
router.post(
  "/create-checkout-session",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { planId } = req.body as { planId: PlanType };

      if (!planId || !PLAN_PRICE_ID[planId]) {
        return res.status(400).json({ error: "Invalid or missing planId" });
      }

      const priceId = PLAN_PRICE_ID[planId];
      if (!priceId) {
        return res.status(400).json({
          error: `Price ID for plan '${planId}' is not configured in environment variables`,
        });
      }

      const userId = String(req.user?.id || req.user?.sub || "");
      const userEmail = req.user?.email ? String(req.user.email) : undefined;

      if (!userId) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Missing user information" });
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        customer_email: userEmail,
        success_url: `${CLIENT_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CLIENT_URL}/pricing/cancel`,
        metadata: {
          userId,
          planId,
        },
      });

      return res.status(200).json({ url: session.url });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to create Stripe checkout session",
        details: (error as Error).message,
      });
    }
  },
);

// --------------------------------------------------------------------------
// 2. POST /api/payment/confirm (Protected: verifyToken - Confirm Payment)
// --------------------------------------------------------------------------
router.post(
  "/confirm",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({ error: "Missing or invalid sessionId" });
      }

      // Retrieve the session directly from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      const currentUserId = String(req.user?.id || req.user?.sub || "");

      if (!currentUserId) {
        return res
          .status(401)
          .json({ error: "Unauthorized: User information missing" });
      }

      // Verify status and ownership: Never trust client blindly!
      if (
        session.status === "complete" &&
        session.payment_status === "paid" &&
        session.metadata?.userId === currentUserId
      ) {
        const newPlan = session.metadata.planId;

        if (!newPlan) {
          return res
            .status(400)
            .json({ error: "Plan information missing in session metadata" });
        }

        // Update user plan in DB (handles both string and ObjectId _id cases)
        const userFilter = ObjectId.isValid(currentUserId)
          ? { _id: new ObjectId(currentUserId) as any }
          : { id: currentUserId };

        await usersCollection.updateOne(userFilter, {
          $set: { plan: newPlan, updatedAt: new Date() },
        });

        return res.status(200).json({
          success: true,
          plan: newPlan,
        });
      } else {
        return res.status(400).json({
          error:
            "Payment confirmation failed. Session is incomplete or user mismatch.",
        });
      }
    } catch (error) {
      return res.status(500).json({
        error: "Failed to confirm payment",
        details: (error as Error).message,
      });
    }
  },
);

export default router;
