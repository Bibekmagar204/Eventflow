import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { fulfillOrderForPaymentIntent } from "@/lib/stripeCheckout"

const finalizeSchema = z.object({
  paymentIntentId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ATTENDEE") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = finalizeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { paymentIntentId } = parsed.data
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      select: {
        id: true,
        userId: true,
        paymentStatus: true,
        tickets: { select: { id: true } },
      },
    })

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.tickets[0]) {
      return NextResponse.json({ data: { status: "succeeded", ticketId: order.tickets[0].id } })
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (intent.status !== "succeeded") {
      return NextResponse.json({
        data: { status: intent.status, ticketId: null },
      })
    }

    const fulfilled = await fulfillOrderForPaymentIntent(paymentIntentId)
    return NextResponse.json({
      data: {
        status: fulfilled.fulfilled ? "succeeded" : "processing",
        ticketId: fulfilled.ticketId ?? null,
      },
    })
  } catch (err) {
    console.error("[POST /api/checkout/finalize]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
