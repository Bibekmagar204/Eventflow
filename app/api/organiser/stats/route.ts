// app/api/organiser/stats/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/organiser/stats
// ORGANISER only — returns aggregate stats across all their events
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ORGANISER") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    // Get all events owned by this organiser
    const events = await prisma.event.findMany({
      where: { organiserId: session.user.id },
      include: {
        orders: {
          where: { status: "PAID" },
          select: { total: true, createdAt: true },
        },
        _count: {
          select: {
            seats: true,
            tickets: true,
          },
        },
      },
    })

    // Aggregate totals
    const totalEvents = events.length
    const publishedEvents = events.filter((e) => e.published).length

    let totalRevenue = 0
    let totalTicketsSold = 0
    let totalCapacity = 0

    // Build per-event summary
    const eventSummaries = events.map((event) => {
      const revenue = event.orders.reduce((sum, o) => sum + o.total, 0)
      const ticketsSold = event._count.tickets
      const capacity = event.capacity

      totalRevenue += revenue
      totalTicketsSold += ticketsSold
      totalCapacity += capacity

      return {
        id: event.id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        published: event.published,
        capacity,
        ticketsSold,
        revenue,
        percentSold: capacity > 0 ? Math.round((ticketsSold / capacity) * 100) : 0,
      }
    })

    // Build daily revenue for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const allOrders = events.flatMap((e) => e.orders)
    const recentOrders = allOrders.filter(
      (o) => new Date(o.createdAt) >= thirtyDaysAgo
    )

    // Group by date string
    const revenueByDay: Record<string, number> = {}
    recentOrders.forEach((order) => {
      const day = new Date(order.createdAt).toISOString().slice(0, 10)
      revenueByDay[day] = (revenueByDay[day] ?? 0) + order.total
    })

    // Convert to sorted array
    const dailyRevenue = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      data: {
        totalEvents,
        publishedEvents,
        totalRevenue,
        totalTicketsSold,
        totalCapacity,
        overallPercentSold:
          totalCapacity > 0
            ? Math.round((totalTicketsSold / totalCapacity) * 100)
            : 0,
        eventSummaries,
        dailyRevenue,
      },
    })
  } catch (err) {
    console.error("[GET /api/organiser/stats]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}