import { Router, Response } from "express";
import { stripe, PLAN_PRICE_ID, PlanType } from "../lib/stripe";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = Router();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// --------------------------------------------------------------------------
// POST /api/payment/create-checkout-session (Protected: verifyToken)
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
        return res
          .status(400)
          .json({
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

export default router;
