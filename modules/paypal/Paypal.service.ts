import { BadRequestError, NotFoundError, ServiceUnavailableError } from "../../core/errors";
import { logger } from "../../core/logger";
import type { PaymentProvider } from "../../infrastructure/payments/PaymentProvider";
import { expiryFrom, isPaypalPlan, resolvePlan } from "./Paypal.plans";
import type { PaypalRepository } from "./Paypal.repository";
import type { CreateOrderBody } from "./Paypal.schemas";

const MISMATCH_MESSAGE = "PayPal order details do not match the stored plan and amount";

export interface PaypalUrls {
  frontendUrl: string;
}

/**
 * Checkout logic: price the plan, create the order, verify and capture it, then grant the subscription.
 * The plan and amount always come from our stored order, never from the capture request.
 */
export class PaypalService {
  constructor(
    private readonly repository: PaypalRepository,
    private readonly payments: PaymentProvider,
    private readonly urls: PaypalUrls,
    private readonly now: () => number = Date.now,
  ) {}

  getClientId(): { clientId: string } {
    const clientId = this.payments.getClientId();
    if (!clientId) throw new ServiceUnavailableError("PayPal not configured");
    return { clientId };
  }

  async createOrder(userId: string, input: CreateOrderBody) {
    const plan = resolvePlan(input.plan, input.donorAmount);
    const order = await this.payments.createCheckoutOrder({
      amount: plan.amount,
      description: plan.description,
      returnUrl: `${this.urls.frontendUrl}/subscription/success`,
      cancelUrl: `${this.urls.frontendUrl}/subscription`,
    });
    await this.repository.createOrder({
      id: order.orderId,
      userId,
      plan: input.plan,
      amount: plan.amount,
    });
    return { orderId: order.orderId, approvalUrl: order.approvalUrl };
  }

  async captureOrder(userId: string, orderId: string) {
    const stored = await this.repository.claimOrder(orderId, userId);
    if (!stored) throw new NotFoundError("PayPal order not found or already processed");

    const expectedAmount = stored.amount.toFixed(2);
    let paymentCaptured = false;
    try {
      if (!isPaypalPlan(stored.plan)) throw new BadRequestError("Invalid plan");

      const details = await this.payments.getOrder(orderId);
      if (
        !details.ok ||
        details.status !== "APPROVED" ||
        details.currencyCode !== "USD" ||
        details.amountValue !== expectedAmount
      ) {
        throw new BadRequestError(MISMATCH_MESSAGE);
      }

      const capture = await this.payments.captureOrder(orderId);
      if (
        !capture.ok ||
        capture.status !== "COMPLETED" ||
        capture.currencyCode !== "USD" ||
        capture.amountValue !== expectedAmount
      ) {
        throw new BadRequestError("Payment not completed");
      }
      paymentCaptured = true;

      const plan = resolvePlan(stored.plan, Number(expectedAmount));
      const expiresAt = expiryFrom(this.now(), plan.durationDays);
      await this.repository.completeOrder({
        orderId,
        userId,
        plan: plan.subscriptionPlan,
        endDate: expiresAt,
      });

      return {
        success: true,
        plan: plan.subscriptionPlan,
        expiresAt,
        message: `Thank you! Your ${plan.subscriptionPlan} subscription is now active.`,
      };
    } catch (error) {
      if (paymentCaptured) {
        // Money was taken but the subscription was not saved: keep the order locked and make it findable.
        logger.error("PayPal payment captured but subscription not saved", { orderId, userId });
      } else {
        await this.repository.releaseOrder(orderId).catch(() => undefined);
      }
      throw error;
    }
  }
}
