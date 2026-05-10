import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { fulfillOrderForPaymentIntent, markOrderPaymentFailed } from "@/lib/stripeCheckout"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook configuration invalid" }, { status: 400 })
  }

  try {
    const payload = await req.text()
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent
      await fulfillOrderForPaymentIntent(intent.id)
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent
      await markOrderPaymentFailed(intent.id, "FAILED")
    }

    if (event.type === "payment_intent.canceled") {
      const intent = event.data.object as Stripe.PaymentIntent
      await markOrderPaymentFailed(intent.id, "CANCELED")
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[POST /api/webhooks/stripe]", err)
    return NextResponse.json({ error: "Invalid webhook event" }, { status: 400 })
  }
}
