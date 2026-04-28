"use client"

import { formatDate, formatPrice } from "@/lib/utils"
import type { TicketDetail } from "@/components/attendee/MyTicketsClient"

interface TicketDetailModalProps {
  ticket: TicketDetail | null
  loading: boolean
  qrDataUrl: string | null
  error?: string | null
  onClose: () => void
}

export default function TicketDetailModal({ ticket, loading, qrDataUrl, error = null, onClose }: TicketDetailModalProps) {
  if (!loading && !error && !ticket) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.92)] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full text-base leading-none text-[color:var(--text-muted-light)] transition duration-200 hover:scale-110 hover:bg-white/10 hover:text-[var(--text-light)]"
        >
          ✕
        </button>

        <div className="p-8">
          {loading ? (
            <div className="animate-pulse">
              <div className="absolute left-0 top-0 h-2 w-full rounded-t-2xl bg-white/10" />

              <div className="mb-6 mt-2 flex items-center justify-between">
                <div className="h-7 w-24 rounded-full bg-white/10" />
                <div className="h-4 w-10 rounded bg-white/10" />
              </div>

              <div className="mb-1 h-8 w-4/5 rounded bg-white/10" />
              <div className="mb-6 h-4 w-1/2 rounded bg-white/10" />

              <div className="mb-6 space-y-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="flex justify-between gap-4">
                    <div className="h-4 w-16 rounded bg-white/10" />
                    <div className="h-4 w-28 rounded bg-white/10" />
                  </div>
                ))}
              </div>

              <div className="my-6 border-t-2 border-dashed border-white/15" />

              <div className="flex flex-col items-center">
                <div className="mb-4 h-3 w-24 rounded bg-white/10" />
                <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                  <div className="h-[220px] w-[220px] rounded bg-white/10" />
                </div>
              </div>
            </div>
          ) : error || !ticket ? (
            <p className="text-sm text-red-300">{error ?? "Ticket not found"}</p>
          ) : (
            <>
              {(() => {
                const isPast = new Date(ticket.event.date) < new Date()
                return (
                  <>
                    <div
                      className={`absolute left-0 top-0 h-2 w-full rounded-t-2xl ${
                        ticket.checkedIn ? "bg-gray-300" : isPast ? "bg-red-400" : "bg-green-500"
                      }`}
                    />

                    <div className="mb-6 mt-2 flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          ticket.checkedIn ? "bg-gray-100 text-gray-500" : isPast ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {ticket.checkedIn ? "✓ Used" : isPast ? "Expired" : "✓ Valid"}
                      </span>
                      <span className="text-xs text-[color:var(--text-muted-light)]">{ticket.seat?.label ?? "GA"}</span>
                    </div>

                    <h2 className="mb-1 text-2xl font-bold text-[var(--text-hero)]">{ticket.event.title}</h2>
                    <p className="mb-6 text-sm text-[color:var(--text-muted-light)]">By {ticket.event.organiser?.name ?? "Unknown"}</p>

                    <div className="mb-6 space-y-2 text-sm text-[var(--text-light)]">
                      <div className="flex justify-between">
                        <span className="text-[color:var(--text-muted-light)]">Date</span>
                        <span>{formatDate(ticket.event.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[color:var(--text-muted-light)]">Venue</span>
                        <span>{ticket.event.venue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[color:var(--text-muted-light)]">Seat</span>
                        <span>{ticket.seat?.label ?? "General Admission"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[color:var(--text-muted-light)]">Paid</span>
                        <span className="font-semibold text-[var(--text-hero)]">{formatPrice(ticket.order.total)}</span>
                      </div>
                      {ticket.order.id && (
                        <div className="flex justify-between">
                          <span className="text-[color:var(--text-muted-light)]">Order</span>
                          <span className="font-mono text-xs text-[color:var(--text-muted-light)]">#{ticket.order.id.slice(-8).toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    <div className="my-6 border-t-2 border-dashed border-white/15" />

                    <div className="flex flex-col items-center">
                      <p className="mb-4 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">Scan at the door</p>
                      {qrDataUrl ? (
                        <div className="rounded-xl border border-white/15 bg-white p-3 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={qrDataUrl} alt="Ticket QR Code" width={220} height={220} className="block" />
                        </div>
                      ) : (
                        <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-white/10">
                          <p className="text-xs text-[color:var(--text-muted-light)]">Generating QR...</p>
                        </div>
                      )}

                      <p className="mt-3 break-all text-center font-mono text-xs text-[color:var(--text-muted-light)]">{ticket.qrCode}</p>
                    </div>

                    {ticket.checkedIn && ticket.usedAt && (
                      <div className="mt-6 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-center">
                        <p className="text-xs text-[color:var(--text-muted-light)]">
                          Checked in at <span className="font-medium text-[var(--text-light)]">{formatDate(ticket.usedAt)}</span>
                        </p>
                      </div>
                    )}
                  </>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
