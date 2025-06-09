import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/actions/stripe.actions";

export async function POST(req: NextRequest) {
  try {
    const { userId, priceId, returnUrl } = await req.json();
    const result = await createCheckoutSession({ userId, priceId, returnUrl });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "API Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
