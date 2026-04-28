"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { generateQR } from "@/lib/qr"
import { formatDate, formatPrice } from "@/lib/utils"
import TicketDetailModal from "@/components/attendee/TicketDetailModal"

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

export interface TicketDetail extends Ticket {
  event: Ticket["event"] & {
    organiser?: { name: string | null }
  }
  order: Ticket["order"] & {
    id?: string
  }
}

interface MyTicketsClientProps {
  initialTickets: TicketDetail[]
  initialError?: string | null
}

export default function MyTicketsClient({ initialTickets, initialError = null }: MyTicketsClientProps) {
  const [tickets] = useState<TicketDetail[]>(initialTickets)
  const [error] = useState<string | null>(initialError)
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const pageSize = 3
  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize))
  const pageStart = (currentPage - 1) * pageSize
  const paginatedTickets = tickets.slice(pageStart, pageStart + pageSize)

  useEffect(() => {
    if (!selectedTicket) return

    let isActive = true

    async function hydrateModal() {
      setModalLoading(true)
      setQrDataUrl(null)

      await new Promise((resolve) => setTimeout(resolve, 180))
      if (!isActive) return
      setModalLoading(false)

      const dataUrl = await generateQR(selectedTicket.qrCode)
      if (isActive) setQrDataUrl(dataUrl)
    }

    hydrateModal()

    return () => {
      isActive = false
    }
  }, [selectedTicket])

  function closeModal() {
    setSelectedTicket(null)
    setModalLoading(false)
    setQrDataUrl(null)
  }

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-[#1f1f1f]">
      <Navbar variant="transparent" />
      <div className="relative flex-1 px-4 py-10 pt-24">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% -20%, rgba(111, 76, 255, 0.45) 0%, rgba(24, 18, 42, 0.95) 45%, #05070f 100%),
              radial-gradient(2px 2px at 12% 18%, rgba(243, 240, 232, 0.55), transparent 65%),
              radial-gradient(2px 2px at 78% 22%, rgba(243, 240, 232, 0.45), transparent 65%),
              radial-gradient(1.5px 1.5px at 22% 75%, rgba(243, 240, 232, 0.45), transparent 65%)
            `,
          }}
        />
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-hero)]">My Tickets</h1>
              <p className="mt-1 text-sm text-[color:var(--text-muted-light)]">All your purchased tickets</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {tickets.length === 0 && !error && (
            <div className="rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.58)] py-20 text-center backdrop-blur">
              <p className="mb-4 text-4xl">🎟</p>
              <p className="text-sm font-medium text-[var(--text-light)]">No tickets yet</p>
              <p className="mt-1 text-sm text-[color:var(--text-muted-light)]">
                Browse events and buy your first ticket
              </p>
            </div>
          )}

          <div className="space-y-4">
            {paginatedTickets.map((ticket) => {
              const isPast = new Date(ticket.event.date) < new Date()

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="cursor-pointer rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.62)] p-6 shadow-sm backdrop-blur transition-all hover:border-white/25"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            ticket.checkedIn
                              ? "bg-gray-100 text-gray-500"
                              : isPast
                                ? "bg-red-100 text-red-500"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {ticket.checkedIn ? "Used" : isPast ? "Expired" : "Valid"}
                        </span>
                        <span className="text-xs text-[color:var(--text-muted-light)]">
                          {ticket.seat?.label ?? "GA"}
                        </span>
                      </div>

                      <h2 className="mb-1 truncate text-base font-semibold text-[var(--text-light)]">
                        {ticket.event.title}
                      </h2>
                      <p className="text-sm text-[color:var(--text-muted-light)]">📅 {formatDate(ticket.event.date)}</p>
                      <p className="text-sm text-[color:var(--text-muted-light)]">📍 {ticket.event.venue}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold text-[var(--text-hero)]">{formatPrice(ticket.order.total)}</p>
                      <p className="mt-1 text-xs text-[color:var(--text-muted-light)]">
                        {formatDate(ticket.order.createdAt)}
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-light)]">View →</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {tickets.length > pageSize && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-white/15 bg-[rgba(20,18,28,0.45)] px-4 py-3">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-[var(--text-light)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <p className="text-xs text-[color:var(--text-muted-light)]">
                Page {currentPage} of {totalPages}
              </p>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-[var(--text-light)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {(selectedTicket || modalLoading) && (
        <TicketDetailModal
          ticket={selectedTicket}
          loading={modalLoading}
          qrDataUrl={qrDataUrl}
          onClose={closeModal}
        />
      )}

      <Footer tone="dark" />
    </main>
  )
}
