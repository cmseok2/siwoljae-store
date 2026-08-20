import { getPaymentGateway } from "../../../../lib/payment";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { paymentKey?: string; orderId?: string; amount?: number };
    if (!body.paymentKey || !body.orderId || !body.amount || body.amount < 1) return Response.json({ message: "잘못된 결제 요청입니다." }, { status: 400 });
    const result = await getPaymentGateway().confirm(body.paymentKey, body.orderId, body.amount);
    return Response.json(result);
  } catch {
    return Response.json({ message: "결제 승인 중 오류가 발생했습니다." }, { status: 500 });
  }
}
