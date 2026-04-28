import Link from "next/link"
import { notFound } from "next/navigation"
import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import { prisma } from "@/lib/prisma"
import { formatDate, formatPrice } from "@/lib/utils"

interface EventDetail {
  id: string
  title: string
  description: string | null
  date: Date
  venue: string
  capacity: number
  price: number
  published: boolean
  availableSeats: number
  organiser: { name: string | null; email: string }
  _count: { seats: number; tickets: number }
}

async function getEvent(id: string): Promise<EventDetail | null> {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organiser: { select: { name: true, email: true } },
      _count: { select: { seats: true, tickets: true } },
    },
  })

  if (!event || !event.published) return null

  const availableSeats = await prisma.seat.count({
    where: { eventId: id, isAvailable: true },
  })

  return { ...event, availableSeats }
}

export default async function PublicEventDetailPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)

  if (!event) notFound()

  const soldOut = event._count.tickets >= event.capacity
  const soldPercent = Math.round(((event.capacity - event.availableSeats) / event.capacity) * 100)

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/#upcoming-events" className="mb-5 inline-flex text-sm text-gray-500 hover:text-gray-700">
          ← Back to events
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {soldOut && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              This event is sold out.
            </div>
          )}

          <h1 className="mb-1 text-3xl font-bold text-gray-900">{event.title}</h1>
          <p className="mb-6 text-sm text-gray-500">Organised by {event.organiser.name ?? "Unknown"}</p>

          <div className="mb-6 grid grid-cols-1 gap-4 text-sm text-gray-700 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">Date & Time</p>
              <p>{formatDate(event.date)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">Venue</p>
              <p>{event.venue}</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">Ticket Price</p>
              <p className="font-semibold text-gray-900">{formatPrice(event.price)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">Availability</p>
              <p className={soldOut ? "font-medium text-red-600" : "font-medium text-green-600"}>
                {soldOut ? "Sold out" : `${event.availableSeats} seats left`}
              </p>
            </div>
          </div>

          {event.description && (
            <div className="mb-6">
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">About this event</p>
              <p className="text-sm leading-relaxed text-gray-600">{event.description}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="mb-1 flex justify-between text-xs text-gray-400">
              <span>{event.capacity - event.availableSeats} sold</span>
              <span>{event.capacity} total</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full ${soldOut ? "bg-red-400" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(soldPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm text-indigo-900">Ready to buy a ticket?</p>
            <p className="mt-1 text-sm text-indigo-700">
              Sign in or create an attendee account to complete checkout.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
