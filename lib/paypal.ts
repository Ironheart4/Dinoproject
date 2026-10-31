import { env } from "../config/env";

export async function getPayPalAccessToken(): Promise<string> {
  if (!env.paypalClientId || !env.paypalSecret) throw new Error("PayPal credentials not configured");
  const auth = Buffer.from(`${env.paypalClientId}:${env.paypalSecret}`).toString("base64");
  const response = await fetch(`${env.paypalApi}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error("PayPal authentication failed");
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal access token missing");
  return data.access_token;
}
