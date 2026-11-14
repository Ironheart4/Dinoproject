import { env } from "../../config/env";
import { InternalError } from "../../core/errors";
import { logger } from "../../core/logger";
import type {
  CreateCheckoutOrderInput,
  CreateCheckoutOrderResult,
  PaymentCaptureResult,
  PaymentOrderDetails,
  PaymentProvider,
} from "./PaymentProvider";

async function getAccessToken(): Promise<string> {
  if (!env.paypalClientId || !env.paypalSecret) {
    throw new Error("PayPal credentials not configured");
  }
  const auth = Buffer.from(`${env.paypalClientId}:${env.paypalSecret}`).toString("base64");
  const response = await fetch(`${env.paypalApi}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error("PayPal authentication failed");
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal access token missing");
  return data.access_token;
}

export class PaypalPaymentProvider implements PaymentProvider {
  isConfigured(): boolean {
    return Boolean(env.paypalClientId);
  }

  getClientId(): string | undefined {
    return env.paypalClientId;
  }

  async createCheckoutOrder(input: CreateCheckoutOrderInput): Promise<CreateCheckoutOrderResult> {
    const accessToken = await getAccessToken();
    const response = await fetch(`${env.paypalApi}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: input.amount },
            description: input.description,
          },
        ],
        application_context: {
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
        },
      }),
    });
    const order = await response.json() as {
      id: string;
      links: Array<{ rel: string; href: string }>;
      error?: unknown;
    };
    if (order.error) {
      logger.error("PayPal create order error", order);
      throw new InternalError("Failed to create PayPal order");
    }
    return {
      orderId: order.id,
      approvalUrl: order.links.find((link) => link.rel === "approve")?.href,
    };
  }

  async getOrder(orderId: string): Promise<PaymentOrderDetails> {
    const accessToken = await getAccessToken();
    const response = await fetch(`${env.paypalApi}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const details = await response.json() as {
      status?: string;
      purchase_units?: Array<{ amount?: { currency_code?: string; value?: string } }>;
    };
    const amount = details.purchase_units?.[0]?.amount;
    return {
      ok: response.ok,
      status: details.status ?? "",
      currencyCode: amount?.currency_code ?? "",
      amountValue: amount?.value ?? "",
    };
  }

  async captureOrder(orderId: string): Promise<PaymentCaptureResult> {
    const accessToken = await getAccessToken();
    const response = await fetch(`${env.paypalApi}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const captureData = await response.json() as {
      status?: string;
      purchase_units?: Array<{
        payments?: { captures?: Array<{ amount?: { currency_code?: string; value?: string } }> };
      }>;
    };
    const captured = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    return {
      ok: response.ok,
      status: captureData.status ?? "",
      currencyCode: captured?.currency_code ?? "",
      amountValue: captured?.value ?? "",
    };
  }
}
