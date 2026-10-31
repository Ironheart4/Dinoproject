import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import { parsePositiveInt, parseBoundedNumber } from "../middleware/validate";

export interface RouteDependencies {
  prisma: PrismaClient;
  supabase: SupabaseClient;
  authLimiter?: RequestHandler;
  aiLimiter?: RequestHandler;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
  upload?: any;
  supabaseStorage?: any;
  profileStorageBucket?: string;
}

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = process.env.PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) throw new Error("PayPal credentials not configured");
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await response.json() as { access_token: string };
  return data.access_token;
}

export function createPaypalRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
router.post("/api/paypal/create-order", deps.authMiddleware, async (req: any, res) => {
  try {
    const { plan } = req.body; // "premium_monthly", "premium_yearly", or "donor"

    let amount: string;
    let description: string;

    switch (plan) {
      case "premium_monthly":
        amount = "3.00";
        description = "DinoProject Premium - Monthly";
        break;
      case "premium_yearly":
        amount = "24.00";
        description = "DinoProject Premium - Yearly";
        break;
      case "donor":
        {
          const donorAmount = parseBoundedNumber(req.body.amount ?? "5.00", 5, 10000);
          if (donorAmount === null) {
            return res.status(400).json({ error: "Donor amount must be a number between 5.00 and 10000.00 USD" });
          }
          amount = donorAmount.toFixed(2);
        }
        description = "DinoProject Donor Support";
        break;
      default:
        return res.status(400).json({ error: "Invalid plan" });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: amount,
          },
          description,
        }],
        application_context: {
          return_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/subscription/success`,
          cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/subscription`,
        },
      }),
    });

    const order = await response.json() as { id: string; links: Array<{ rel: string; href: string }>; error?: any };

    if (order.error) {
      console.error("PayPal create order error:", order);
      return res.status(500).json({ error: "Failed to create PayPal order" });
    }

    await prisma.payPalOrder.create({
      data: {
        id: order.id,
        userId: req.user.id,
        plan,
        amount,
      },
    });

    res.json({
      orderId: order.id,
      approvalUrl: order.links.find((l) => l.rel === "approve")?.href,
    });
  } catch (error) {
    console.error("PayPal create order error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Capture PayPal order (after user approves)
router.post("/api/paypal/capture-order", deps.authMiddleware, async (req: any, res) => {
  try {
    const { orderId } = req.body;
    if (typeof orderId !== "string" || !orderId.trim()) {
      return res.status(400).json({ error: "Valid orderId required" });
    }

    const storedOrder = await prisma.payPalOrder.findFirst({
      where: { id: orderId, userId: req.user.id, status: "created" },
    });
    if (!storedOrder) {
      return res.status(404).json({ error: "PayPal order not found or already processed" });
    }

    const accessToken = await getPayPalAccessToken();

    const orderDetailsResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const orderDetails = await orderDetailsResponse.json() as {
      status?: string;
      purchase_units?: Array<{ amount?: { currency_code?: string; value?: string } }>;
    };
    const purchasedAmount = orderDetails.purchase_units?.[0]?.amount;
    if (!orderDetailsResponse.ok || orderDetails.status !== "APPROVED" ||
        purchasedAmount?.currency_code !== "USD" ||
        purchasedAmount.value !== storedOrder.amount.toFixed(2)) {
      return res.status(400).json({ error: "PayPal order details do not match the stored plan and amount" });
    }

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const captureData = await response.json() as { status?: string; id?: string };

    if (!response.ok || captureData.status !== "COMPLETED") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    await prisma.payPalOrder.update({
      where: { id: storedOrder.id },
      data: { status: "captured" },
    });

    // Calculate expiry based on plan
    let expiresAt: Date;
    let subscriptionPlan: string;

    switch (storedOrder.plan) {
      case "premium_monthly":
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        subscriptionPlan = "premium";
        break;
      case "premium_yearly":
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days
        subscriptionPlan = "premium";
        break;
      case "donor":
        expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months
        subscriptionPlan = "donor";
        break;
      default:
        return res.status(400).json({ error: "Invalid plan" });
    }

    // Update or create subscription
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });

    if (existingSub) {
      await prisma.subscription.update({
        where: { userId: req.user.id },
        data: {
          plan: subscriptionPlan,
          status: "active",
          endDate: expiresAt,
          paypalOrderId: orderId,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: req.user.id,
          plan: subscriptionPlan,
          status: "active",
          endDate: expiresAt,
          paypalOrderId: orderId,
        },
      });
    }

    res.json({
      success: true,
      plan: subscriptionPlan,
      expiresAt,
      message: `Thank you! Your ${subscriptionPlan} subscription is now active.`,
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

// Get PayPal client ID for frontend
router.get("/api/paypal/client-id", (_req, res) => {
  if (!PAYPAL_CLIENT_ID) {
    return res.status(503).json({ error: "PayPal not configured" });
  }
  res.json({ clientId: PAYPAL_CLIENT_ID });
});

// ==================== AI DINO ASSISTANT (Hugging Face) ====================

// Hugging Face config: set HUGGINGFACE_API_KEY to enable the AI DinoBot.
// If the key is missing or the model is overloaded, the AI endpoint will gracefully fallback to `getLocalDinoResponse`.
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base";

// Simple in-memory cache for repeated questions (lightweight)
const aiResponseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes cache
const MAX_CACHE_SIZE = 100; // Limit cache size for low RAM

// Clean old cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of aiResponseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      aiResponseCache.delete(key);
    }
  }
  // If still too large, remove oldest entries
  if (aiResponseCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(aiResponseCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => aiResponseCache.delete(key));
  }
}

// Normalize question for cache key
function normalizeQuestion(q: string): string {
  return q.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}


  return router;
}
