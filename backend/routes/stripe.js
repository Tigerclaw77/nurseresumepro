import express from "express";
import Stripe from "stripe";
import { PREVIEWS } from "./generate.js";
import fetch from "node-fetch";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe/create-checkout-session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { previewId, docType, email } = req.body;
    if (!previewId) return res.status(400).json({ error: "previewId required" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: Number(process.env.PRICE_CENTS || 1000),
          product_data: { name: docType === "cover" ? "Full Cover Letter (.docx)" : "Full Resume (.docx)" },
        },
        quantity: 1,
      }],
      customer_email: email || undefined,
      success_url: `${process.env.PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_BASE_URL}/cancel`,
      metadata: { previewId, docType },
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Stripe session failed" });
  }
});

// POST /api/stripe/webhook
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const to = session.customer_details?.email || session.customer_email;
    const previewId = session.metadata?.previewId;

    if (to && previewId && PREVIEWS.has(previewId)) {
      // Call our internal generator to create and email the doc (no user action needed)
      try {
        await fetch(`${process.env.API_BASE}/api/generate/full`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN || ""}` },
          body: JSON.stringify({ to, previewId }),
        });
      } catch (e) {
        console.error("Failed to trigger full generation", e);
      }
    }
  }

  res.json({ received: true });
});

export default router;
