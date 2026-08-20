import { getPaymentGateway } from "../../../../lib/payment";
import { productCatalog } from "../../../../lib/products";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { productIds?: number[]; customer?: { name?: string; phone?: string; email?: string } };
    const productIds = [...new Set(body.productIds ?? [])];
    const items = productIds.map((id) => productCatalog[id]).filter(Boolean);
    const customer = body.customer;

    if (!items.length) return Response.json({ message: "결제할 상품이 없습니다." }, { status: 400 });
    if (!customer?.name?.trim() || !/^01\d-?\d{3,4}-?\d{4}$/.test(customer.phone ?? "") || !/^\S+@\S+\.\S+$/.test(customer.email ?? "")) {
      return Response.json({ message: "주문자 정보를 정확히 입력해주세요." }, { status: 400 });
    }

    const amount = items.reduce((sum, item) => sum + item.price, 0);
    const orderId = `SJ-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const result = await getPaymentGateway().prepare({ orderId, amount, orderName: items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`, customer: { name: customer.name.trim(), phone: customer.phone!, email: customer.email! } });
    return Response.json({ ...result, amount });
  } catch {
    return Response.json({ message: "결제 준비 중 오류가 발생했습니다." }, { status: 500 });
  }
}
