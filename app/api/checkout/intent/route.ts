import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { purchaseSchema } from "@/lib/validations"
import { fulfillOrderById, toAmountCents, toAmountTotal } from "@/lib/stripeCheckout"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ATTENDEE") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = purchaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { eventId } = parsed.data
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, price: true, published: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    if (!event.published) {
      return NextResponse.json({ error: "Event is not available" }, { status: 400 })
    }

    const availableSeats = await prisma.seat.count({
      where: { eventId, isAvailable: true },
    })
    if (availableSeats < 1) {
      return NextResponse.json({ error: "No seats available" }, { status: 400 })
    }

    const amountCents = toAmountCents(event.price)

    if (amountCents <= 0) {
      const order = await prisma.order.create({
        data: {
          userId: session.user.id,
          eventId,
          status: "PAID",
          paymentStatus: "SUCCEEDED",
          total: 0,
          amountCents: 0,
          currency: "usd",
          paymentProvider: "FREE",
        },
      })
      const fulfilled = await fulfillOrderById(order.id)
      return NextResponse.json({
        data: {
          requiresPayment: false,
          ticketId: fulfilled.ticketId ?? null,
        },
      })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        eventId,
        userId: session.user.id,
      },
    })

    await prisma.order.create({
      data: {
        userId: session.user.id,
        eventId,
        status: "PENDING",
        paymentStatus: "PENDING",
        total: toAmountTotal(amountCents),
        amountCents,
        currency: "usd",
        paymentProvider: "STRIPE",
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    return NextResponse.json({
      data: {
        requiresPayment: true,
        eventId,
        amountCents,
        currency: "usd",
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      },
    })
  } catch (err) {
    console.error("[POST /api/checkout/intent]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
