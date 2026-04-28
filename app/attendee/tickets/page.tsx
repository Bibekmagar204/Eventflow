import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import MyTicketsClient, { TicketDetail } from "@/components/attendee/MyTicketsClient"

async function getAttendeeTickets(userId: string): Promise<TicketDetail[]> {
  const tickets = await prisma.ticket.findMany({
    where: {
      order: { userId },
    },
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
        select: { id: true, status: true, total: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return tickets.map((ticket) => ({
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    usedAt: ticket.usedAt ? ticket.usedAt.toISOString() : null,
    event: {
      ...ticket.event,
      date: ticket.event.date.toISOString(),
    },
    order: {
      ...ticket.order,
      createdAt: ticket.order.createdAt.toISOString(),
    },
  }))
}

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ATTENDEE") {
    redirect("/login")
  }

  try {
    const tickets = await getAttendeeTickets(session.user.id)
    return <MyTicketsClient initialTickets={tickets} />
  } catch {
    return <MyTicketsClient initialTickets={[]} initialError="Failed to load tickets" />
  }
}