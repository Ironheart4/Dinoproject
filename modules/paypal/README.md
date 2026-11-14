# PayPal module

Checkout for Premium and donor plans.

| Layer | File |
|---|---|
| Schemas | `Paypal.schemas.ts` |
| Plans (prices, durations) | `Paypal.plans.ts` |
| Repository | `Paypal.repository.ts` |
| Service | `Paypal.service.ts` |
| Controller | `Paypal.controller.ts` |
| Routes | `Paypal.routes.ts` |

Routes (see `docs/api-reference.md`):
- `POST /api/paypal/create-order`, `POST /api/paypal/capture-order` (user)
- `GET /api/paypal/client-id` (public; 503 when PayPal is not configured)

Rules:
- Plan prices and durations live only in `Paypal.plans.ts`. Money is handled as two-decimal strings.
- The plan and amount are stored when the order is created. On capture they are read back from our database and
  compared with what PayPal reports (status, currency USD, amount); the capture request body is never trusted.
- An order is claimed atomically (`created` to `processing`) before it is captured, so it can be credited only once.
  If verification or capture fails it is released and can be retried. If money was captured but saving the
  subscription failed, the order stays `processing` and an error is logged with the order id for manual follow-up.
- A successful capture marks the order captured and creates or extends the subscription in one transaction.
- Access to PayPal sits behind the `PaymentProvider` interface (`infrastructure/payments`), so tests use a fake.

Note: the frontend currently activates Premium through a PayPal payment link plus a manual email, and does not call
these routes yet.
