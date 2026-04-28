import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OrganiserDashboardClient, {
  Order,
  PrefetchedEventDetail,
  Stats,
} from "@/components/organiser/OrganiserDashboardClient"

async function getInitialStats(): Promise<Stats> {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ORGANISER") {
    throw new Error("Unauthorised")
  }

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

  const totalEvents = events.length
  const publishedEvents = events.filter((e) => e.published).length

  let totalRevenue = 0
  let totalTicketsSold = 0
  let totalCapacity = 0

  const eventSummaries = events.map((event) => {
    const revenue = event.orders.reduce((sum, order) => sum + order.total, 0)
    const ticketsSold = event._count.tickets
    const capacity = event.capacity

    totalRevenue += revenue
    totalTicketsSold += ticketsSold
    totalCapacity += capacity

    return {
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      venue: event.venue,
      published: event.published,
      capacity,
      ticketsSold,
      revenue,
      percentSold: capacity > 0 ? Math.round((ticketsSold / capacity) * 100) : 0,
    }
  })

  return {
    totalEvents,
    publishedEvents,
    totalRevenue,
    totalTicketsSold,
    totalCapacity,
    overallPercentSold: totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0,
    eventSummaries,
  }
}

async function getPrefetchedEventDetails(organiserId: string): Promise<Record<string, PrefetchedEventDetail>> {
  const events = await prisma.event.findMany({
    where: { organiserId },
    include: {
      organiser: { select: { name: true, email: true } },
      _count: { select: { seats: true, tickets: true } },
    },
    orderBy: { date: "asc" },
  })

  return Object.fromEntries(
    events.map((event) => [
      event.id,
      {
        id: event.id,
        title: event.title,
        description: event.description,
        imageUrl: (event as any).imageUrl,
        date: event.date.toISOString(),
        venue: event.venue,
        capacity: event.capacity,
        price: event.price,
        published: event.published,
        createdAt: event.createdAt.toISOString(),
        availableSeats: event.capacity - event._count.tickets,
        organiser: {
          name: event.organiser.name,
          email: event.organiser.email,
        },
        _count: { seats: event._count.seats, tickets: event._count.tickets },
      } satisfies PrefetchedEventDetail,
    ])
  )
}

async function getPrefetchedOrdersByEvent(organiserId: string): Promise<Record<string, Order[]>> {
  const orders = await prisma.order.findMany({
    where: { event: { organiserId } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      tickets: { include: { seat: { select: { label: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return orders.reduce<Record<string, Order[]>>((acc, order) => {
    const key = order.eventId
    if (!acc[key]) acc[key] = []
    acc[key].push({
      id: order.id,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      user: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email ?? "",
      },
      tickets: order.tickets.map((ticket) => ({
        id: ticket.id,
        seat: ticket.seat ? { label: ticket.seat.label } : null,
      })),
    })
    return acc
  }, {})
}

export default async function OrganiserDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ORGANISER") {
    redirect("/login")
  }

  try {
    const initialStats = await getInitialStats()
    const prefetchedEventDetails = await getPrefetchedEventDetails(session.user.id)
    const prefetchedOrdersByEvent = await getPrefetchedOrdersByEvent(session.user.id)
    return (
      <OrganiserDashboardClient
        initialStats={initialStats}
        prefetchedEventDetails={prefetchedEventDetails}
        prefetchedOrdersByEvent={prefetchedOrdersByEvent}
      />
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard"
    return (
      <OrganiserDashboardClient
        initialStats={null}
        prefetchedEventDetails={{}}
        prefetchedOrdersByEvent={{}}
        initialError={message}
      />
    )
  }
}