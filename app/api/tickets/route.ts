// app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/tickets
// Attendee only — legacy endpoint now replaced by Stripe checkout flow
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ATTENDEE") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    await req.json().catch(() => null)
    return NextResponse.json(
      { error: "Use /api/checkout/intent and /api/checkout/finalize for purchases." },
      { status: 410 }
    )
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