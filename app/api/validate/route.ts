// app/api/validate/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/validate
// STAFF only — validates a ticket by its QR code UUID
// Marks it as checked in if valid
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    const body = await req.json()
    const { qrCode } = body

    if (!qrCode || typeof qrCode !== "string") {
      return NextResponse.json({ error: "qrCode is required" }, { status: 400 })
    }

    // Look up ticket by QR code value
    const ticket = await prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            venue: true,
          },
        },
        seat: {
          select: { label: true },
        },
        order: {
          select: {
            status: true,
            userId: true,
          },
        },
      },
    })

    // Ticket not found
    if (!ticket) {
      return NextResponse.json(
        { valid: false, reason: "Ticket not found" },
        { status: 404 }
      )
    }

    // Order was not paid
    if (ticket.order.status !== "PAID") {
      return NextResponse.json(
        { valid: false, reason: "Ticket order was not completed" },
        { status: 400 }
      )
    }

    // Already checked in
    if (ticket.checkedIn) {
      return NextResponse.json(
        {
          valid: false,
          reason: "Ticket already used",
          checkedInAt: ticket.usedAt,
          ticket: {
            event: ticket.event,
            seat: ticket.seat,
          },
        },
        { status: 400 }
      )
    }

    // Mark as checked in
    const updated = await prisma.ticket.update({
      where: { qrCode },
      data: {
        checkedIn: true,
        usedAt: new Date(),
      },
    })

    return NextResponse.json({
      valid: true,
      checkedInAt: updated.usedAt,
      ticket: {
        id: ticket.id,
        event: ticket.event,
        seat: ticket.seat,
      },
    })
  } catch (err) {
    console.error("[POST /api/validate]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}