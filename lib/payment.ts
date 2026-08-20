export type PaymentProvider = "mock" | "toss" | "portone";

export type PaymentRequest = {
  orderId: string;
  amount: number;
  orderName: string;
  customer: { name: string; phone: string; email: string };
};

export type PaymentResult = {
  paymentKey: string;
  orderId: string;
  status: "READY" | "PAID" | "FAILED";
};

export interface PaymentGateway {
  prepare(request: PaymentRequest): Promise<PaymentResult>;
  confirm(paymentKey: string, orderId: string, amount: number): Promise<PaymentResult>;
}

class MockPaymentGateway implements PaymentGateway {
  async prepare(request: PaymentRequest): Promise<PaymentResult> {
    return { paymentKey: `mock_${crypto.randomUUID()}`, orderId: request.orderId, status: "READY" };
  }

  async confirm(paymentKey: string, orderId: string): Promise<PaymentResult> {
    return { paymentKey, orderId, status: "PAID" };
  }
}

// 결제사를 정한 뒤 TossPaymentGateway 또는 PortOnePaymentGateway를 추가하고
// PAYMENT_PROVIDER 환경값에 따라 반환하는 구현체만 교체하면 됩니다.
export function getPaymentGateway(): PaymentGateway {
  return new MockPaymentGateway();
}

