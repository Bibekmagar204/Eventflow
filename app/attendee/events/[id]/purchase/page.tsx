// app/attendee/events/[id]/purchase/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { formatDate, formatPrice } from "@/lib/utils"

interface EventDetail {
  id: string
  title: string
  description: string | null
  date: string
  venue: string
  price: number
  availableSeats: number
  organiser: { name: string | null }
  _count: { tickets: number }
}

type PurchaseState = "idle" | "loading" | "success" | "error"

export default function PurchasePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [purchaseState, setPurchaseState] = useState<PurchaseState>("idle")
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)

  // Load event details
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Failed to load event")
        if (!json.data.published) {
          router.replace("/attendee/events")
          return
        }
        if (json.data.availableSeats === 0) {
          router.replace(`/attendee/events/${id}`)
          return
        }
        setEvent(json.data)
      } catch (err: any) {
        setFetchError(err.message)
      } finally {
        setLoadingEvent(false)
      }
    }
    fetchEvent()
  }, [id])

  async function handlePurchase() {
    setPurchaseState("loading")
    setPurchaseError(null)

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? "Purchase failed")
      }

      setTicketId(json.data.id)
      setPurchaseState("success")
    } catch (err: any) {
      setPurchaseError(err.message)
      setPurchaseState("error")
    }
  }

  // ── Loading state ──────────────────────────────────────
  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading event...</p>
      </div>
    )
  }

  // ── Fetch error ────────────────────────────────────────
  if (fetchError || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-sm">{fetchError ?? "Event not found"}</p>
          <button
            onClick={() => router.push("/attendee/events")}
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            ← Back to events
          </button>
        </div>
      </div>
    )
  }

  // ── Success state ──────────────────────────────────────
  if (purchaseState === "success" && ticketId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          {/* Success icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You&apos;re going!
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Your ticket for <span className="font-medium text-gray-700">{event.title}</span> has been confirmed.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push(`/attendee/tickets/${ticketId}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              View My Ticket
            </button>
            <button
              onClick={() => router.push("/attendee/tickets")}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              All My Tickets
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main purchase confirmation ──────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto space-y-6">

        {/* Back link */}
        <button
          onClick={() => router.push(`/attendee/events/${id}`)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back to event
        </button>

        {/* Order summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">
            Confirm Your Ticket
          </h1>

          {/* Event summary */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Event</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">
                {event.title}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-700">{formatDate(event.date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Venue</span>
              <span className="text-gray-700">{event.venue}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Organiser</span>
              <span className="text-gray-700">
                {event.organiser.name ?? "Unknown"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Seats left</span>
              <span
                className={
                  event.availableSeats <= 10
                    ? "text-amber-600 font-medium"
                    : "text-green-600 font-medium"
                }
              >
                {event.availableSeats}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-4" />

          {/* Total */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(event.price)}
            </span>
          </div>

          {/* Simulated payment notice */}
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700 mb-6">
            💳 Payment is simulated — no real charge will be made.
          </div>

          {/* Purchase error */}
          {purchaseState === "error" && purchaseError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
              {purchaseError}
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handlePurchase}
            disabled={purchaseState === "loading"}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
          >
            {purchaseState === "loading"
              ? "Processing..."
              : event.price === 0
              ? "Claim Free Ticket"
              : `Confirm Purchase — ${formatPrice(event.price)}`}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            One ticket per purchase. You can buy again for additional tickets.
          </p>
        </div>

      </div>
    </div>
  )
}