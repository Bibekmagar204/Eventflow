// app/api/organiser/events/[id]/orders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: { id: string }
}

// GET /api/organiser/events/:id/orders
// ORGANISER only — returns all orders for a specific event
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ORGANISER") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    // Verify organiser owns this event
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.organiserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const orders = await prisma.order.findMany({
      where: { eventId: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        tickets: {
          include: {
            seat: { select: { label: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: orders })
  } catch (err) {
    console.error("[GET /api/organiser/events/:id/orders]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/organiser/events/:id/orders
// ORGANISER only — refunds an order by setting status to REFUNDED
// Body: { orderId: string }
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ORGANISER") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    // Verify organiser owns this event
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.organiserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { orderId } = body

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    // Find the order and make sure it belongs to this event
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tickets: {
          include: { seat: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.eventId !== params.id) {
      return NextResponse.json({ error: "Order does not belong to this event" }, { status: 400 })
    }

    if (order.status === "REFUNDED") {
      return NextResponse.json({ error: "Order already refunded" }, { status: 400 })
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Order is cancelled" }, { status: 400 })
    }

    // Refund in a transaction:
    // 1. Set order status to REFUNDED
    // 2. Restore seat availability for each ticket
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED" },
      })

      // Restore seats to available
      const seatIds = order.tickets
        .map((t) => t.seatId)
        .filter((id): id is string => id !== null)

      if (seatIds.length > 0) {
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: { isAvailable: true },
        })
      }

      // Mark tickets as unchecked (invalidate them)
      await tx.ticket.updateMany({
        where: { orderId },
        data: { checkedIn: false },
      })
    })

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error("[PATCH /api/organiser/events/:id/orders]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}