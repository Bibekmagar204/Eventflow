// app/attendee/tickets/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { formatDate, formatPrice } from "@/lib/utils"
import { generateQR } from "@/lib/qr"

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
    organiser: { name: string | null }
  }
  seat: { label: string } | null
  order: {
    id: string
    status: string
    total: number
    createdAt: string
  }
}

export default function TicketDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`/api/tickets/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Failed to load ticket")
        setTicket(json.data)

        // Generate QR code image from the stored UUID string
        const dataUrl = await generateQR(json.data.qrCode)
        setQrDataUrl(dataUrl)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTicket()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading ticket...</p>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-sm">{error ?? "Ticket not found"}</p>
          <button
            onClick={() => router.push("/attendee/tickets")}
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            ← Back to my tickets
          </button>
        </div>
      </div>
    )
  }

  const isPast = new Date(ticket.event.date) < new Date()

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto space-y-6">

        {/* Back link */}
        <button
          onClick={() => router.push("/attendee/tickets")}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back to my tickets
        </button>

        {/* Ticket card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Top color bar — green valid, gray used, red expired */}
          <div
            className={`h-2 w-full ${
              ticket.checkedIn
                ? "bg-gray-300"
                : isPast
                ? "bg-red-400"
                : "bg-green-500"
            }`}
          />

          <div className="p-8">
            {/* Status badge */}
            <div className="flex items-center justify-between mb-6">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  ticket.checkedIn
                    ? "bg-gray-100 text-gray-500"
                    : isPast
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {ticket.checkedIn ? "✓ Used" : isPast ? "Expired" : "✓ Valid"}
              </span>
              <span className="text-xs text-gray-400">
                {ticket.seat?.label ?? "GA"}
              </span>
            </div>

            {/* Event title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {ticket.event.title}
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              By {ticket.event.organiser.name ?? "Unknown"}
            </p>

            {/* Event details */}
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Date</span>
                <span>{formatDate(ticket.event.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Venue</span>
                <span>{ticket.event.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Seat</span>
                <span>{ticket.seat?.label ?? "General Admission"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Paid</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(ticket.order.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Order</span>
                <span className="font-mono text-xs text-gray-500">
                  #{ticket.order.id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Divider with dashed style to mimic real ticket */}
            <div className="border-t-2 border-dashed border-gray-200 my-6" />

            {/* QR Code */}
            <div className="flex flex-col items-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">
                Scan at the door
              </p>

              {qrDataUrl ? (
                <div className="p-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Ticket QR Code"
                    width={220}
                    height={220}
                    className="block"
                  />
                </div>
              ) : (
                <div className="w-[220px] h-[220px] bg-gray-100 rounded-xl flex items-center justify-center">
                  <p className="text-gray-400 text-xs">Generating QR...</p>
                </div>
              )}

              {/* QR code UUID in small text for manual lookup */}
              <p className="text-xs text-gray-300 mt-3 font-mono break-all text-center">
                {ticket.qrCode}
              </p>
            </div>

            {/* Checked in timestamp */}
            {ticket.checkedIn && ticket.usedAt && (
              <div className="mt-6 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-center">
                <p className="text-xs text-gray-500">
                  Checked in at{" "}
                  <span className="font-medium">
                    {formatDate(ticket.usedAt)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}