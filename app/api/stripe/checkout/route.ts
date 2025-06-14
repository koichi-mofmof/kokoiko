import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/actions/stripe.actions";

interface CheckoutRequestBody {
  userId: string;
  priceId: string;
  returnUrl: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequestBody = await req.json();
    const { userId, priceId, returnUrl } = body;
    const result = await createCheckoutSession({ userId, priceId, returnUrl });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "API Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
