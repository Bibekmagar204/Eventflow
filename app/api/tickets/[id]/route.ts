// app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/tickets/:id
// Returns a single ticket with full event, seat, and order details
// Only the ticket owner or a STAFF member can access it
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            venue: true,
            price: true,
            organiser: { select: { name: true } },
          },
        },
        seat: {
          select: { label: true },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            userId: true,
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Only the ticket owner or STAFF can view a ticket
    const isOwner = ticket.order.userId === session.user.id
    const isStaff = session.user.role === "STAFF"

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ data: ticket })
  } catch (err) {
    console.error("[GET /api/tickets/:id]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}