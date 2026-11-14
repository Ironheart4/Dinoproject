export interface CreateCheckoutOrderInput {
  amount: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutOrderResult {
  orderId: string;
  approvalUrl: string | undefined;
}

export interface PaymentOrderDetails {
  ok: boolean;
  status: string;
  currencyCode: string;
  amountValue: string;
}

export interface PaymentCaptureResult {
  ok: boolean;
  status: string;
  currencyCode: string;
  amountValue: string;
}

export interface PaymentProvider {
  isConfigured(): boolean;
  getClientId(): string | undefined;
  createCheckoutOrder(input: CreateCheckoutOrderInput): Promise<CreateCheckoutOrderResult>;
  getOrder(orderId: string): Promise<PaymentOrderDetails>;
  captureOrder(orderId: string): Promise<PaymentCaptureResult>;
}
