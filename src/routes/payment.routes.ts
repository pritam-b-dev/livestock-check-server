import { Router } from "express";
import { stripe } from "../lib/stripe";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

router.post("/create-checkout-session", verifyToken, async (req, res) => {
  const { plan } = req.body; // 'growth' or 'business'

  const priceId =
    plan === "business"
      ? process.env.STRIPE_BUSINESS_PRICE_ID
      : process.env.STRIPE_GROWTH_PRICE_ID;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.CLIENT_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
