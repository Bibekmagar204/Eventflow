// app/attendee/tickets/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDate, formatPrice } from "@/lib/utils"

interface Ticket {
  id: string
  qrCode: string
  checkedIn: boolean
  usedAt: string | null
  createdAt: string
  event: {
    id: string
    title: string
    date: string
    venue: string
    price: number
  }
  seat: { label: string } | null
  order: {
    status: string
    total: number
    createdAt: string
  }
}

export default function MyTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch("/api/tickets")
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Failed to load tickets")
        setTickets(json.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your tickets...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
            <p className="text-sm text-gray-500 mt-1">
              All your purchased tickets
            </p>
          </div>
          <button
            onClick={() => router.push("/attendee/events")}
            className="text-sm text-blue-600 hover:underline"
          >
            Browse Events →
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {tickets.length === 0 && !error && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-4">🎟</p>
            <p className="text-gray-500 text-sm font-medium">
              No tickets yet
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Browse events and buy your first ticket
            </p>
            <button
              onClick={() => router.push("/attendee/events")}
              className="mt-4 text-blue-600 text-sm font-medium hover:underline"
            >
              Browse Events →
            </button>
          </div>
        )}

        {/* Ticket list */}
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const isPast = new Date(ticket.event.date) < new Date()

            return (
              <div
                key={ticket.id}
                onClick={() => router.push(`/attendee/tickets/${ticket.id}`)}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: ticket info */}
                  <div className="flex-1 min-w-0">
                    {/* Status badges */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          ticket.checkedIn
                            ? "bg-gray-100 text-gray-500"
                            : isPast
                            ? "bg-red-100 text-red-500"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {ticket.checkedIn
                          ? "Used"
                          : isPast
                          ? "Expired"
                          : "Valid"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {ticket.seat?.label ?? "GA"}
                      </span>
                    </div>

                    {/* Event title */}
                    <h2 className="text-base font-semibold text-gray-900 truncate mb-1">
                      {ticket.event.title}
                    </h2>

                    {/* Event meta */}
                    <p className="text-sm text-gray-500">
                      📅 {formatDate(ticket.event.date)}
                    </p>
                    <p className="text-sm text-gray-500">
                      📍 {ticket.event.venue}
                    </p>
                  </div>

                  {/* Right: price + arrow */}
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-gray-900">
                      {formatPrice(ticket.order.total)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(ticket.order.createdAt)}
                    </p>
                    <p className="text-blue-500 text-sm mt-2">View →</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}