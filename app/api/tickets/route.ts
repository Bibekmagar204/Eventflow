// app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

// POST /api/tickets
// Attendee only — simulated purchase flow
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ATTENDEE") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    const body = await req.json()
    const { eventId } = body

    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }

    // Load event to get price and check it exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!event.published) {
      return NextResponse.json({ error: "Event is not available" }, { status: 400 })
    }

    // Find the first available seat
    const seat = await prisma.seat.findFirst({
      where: { eventId, isAvailable: true },
    })

    if (!seat) {
      return NextResponse.json({ error: "No seats available" }, { status: 400 })
    }

    // Generate a unique QR code value (UUID)
    const qrCode = uuidv4()

    // Create Order + Ticket + mark seat unavailable — all in one transaction
    const ticket = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          eventId,
          total: event.price,
          status: "PAID", // simulated — no real payment
        },
      })

      // Mark seat as taken
      await tx.seat.update({
        where: { id: seat.id },
        data: { isAvailable: false },
      })

      // Create the ticket linked to order + seat
      const newTicket = await tx.ticket.create({
        data: {
          orderId: order.id,
          eventId,
          seatId: seat.id,
          qrCode,
        },
      })

      return newTicket
    })

    return NextResponse.json({ data: ticket }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/tickets]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/tickets
// Attendee only — returns all tickets for the logged-in attendee
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ATTENDEE") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        order: { userId: session.user.id },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            venue: true,
            price: true,
          },
        },
        seat: {
          select: { label: true },
        },
        order: {
          select: { status: true, total: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: tickets })
  } catch (err) {
    console.error("[GET /api/tickets]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}