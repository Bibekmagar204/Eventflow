import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

export function toAmountCents(amount: number): number {
  return Math.round(amount * 100)
}

export function toAmountTotal(amountCents: number): number {
  return amountCents / 100
}

export async function fulfillOrderForPaymentIntent(paymentIntentId: string): Promise<{
  fulfilled: boolean
  ticketId?: string
  reason?: string
}> {
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true },
  })

  if (!order) {
    return { fulfilled: false, reason: "Order not found" }
  }

  return fulfillOrderById(order.id)
}

export async function fulfillOrderById(orderId: string): Promise<{
  fulfilled: boolean
  ticketId?: string
  reason?: string
}> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        tickets: { select: { id: true } },
      },
    })

    if (!order) {
      return { fulfilled: false, reason: "Order not found" }
    }

    if (order.tickets.length > 0) {
      return { fulfilled: true, ticketId: order.tickets[0].id }
    }

    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      return { fulfilled: false, reason: "Order is not payable" }
    }

    const seat = await tx.seat.findFirst({
      where: { eventId: order.eventId, isAvailable: true },
      select: { id: true },
    })

    if (!seat) {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
        },
      })
      return { fulfilled: false, reason: "No seats available" }
    }

    await tx.seat.update({
      where: { id: seat.id },
      data: { isAvailable: false },
    })

    const ticket = await tx.ticket.create({
      data: {
        orderId: order.id,
        eventId: order.eventId,
        seatId: seat.id,
        qrCode: uuidv4(),
      },
      select: { id: true },
    })

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentStatus: "SUCCEEDED",
      },
    })

    return { fulfilled: true, ticketId: ticket.id }
  })
}

export async function markOrderPaymentFailed(
  paymentIntentId: string,
  reasonStatus: "FAILED" | "CANCELED" = "FAILED"
) {
  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntentId },
    data: {
      paymentStatus: reasonStatus,
      status: reasonStatus === "CANCELED" ? "CANCELLED" : "PENDING",
    },
  })
}
