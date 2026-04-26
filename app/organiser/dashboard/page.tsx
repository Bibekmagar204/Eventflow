// app/organiser/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDate, formatPrice } from "@/lib/utils"

// ── Types ───────────────────────────────────────────────
interface EventSummary {
  id: string
  title: string
  date: string
  venue: string
  published: boolean
  capacity: number
  ticketsSold: number
  revenue: number
  percentSold: number
}

interface DailyRevenue {
  date: string
  revenue: number
}

interface Stats {
  totalEvents: number
  publishedEvents: number
  totalRevenue: number
  totalTicketsSold: number
  totalCapacity: number
  overallPercentSold: number
  eventSummaries: EventSummary[]
  dailyRevenue: DailyRevenue[]
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  user: { id: string; name: string | null; email: string }
  tickets: { id: string; seat: { label: string } | null }[]
}

export default function OrganiserDashboard() {
  const router = useRouter()

  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("")
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [refundingId, setRefundingId] = useState<string | null>(null)

  // ── Fetch stats ────────────────────────────────────────
  async function fetchStats() {
    try {
      const res = await fetch("/api/organiser/stats")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to load stats")
      setStats(json.data)
    } catch (err: any) {
      setStatsError(err.message)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // ── Fetch orders ───────────────────────────────────────
  async function fetchOrders(eventId: string, eventTitle: string) {
    setSelectedEventId(eventId)
    setSelectedEventTitle(eventTitle)
    setLoadingOrders(true)
    setOrdersError(null)
    setOrders([])

    try {
      const url = `/api/organiser/events/${eventId}/orders`
      console.log("Fetching orders from:", url)

      const res = await fetch(url)
      const json = await res.json()

      console.log("Orders API response:", res.status, json)

      if (!res.ok) throw new Error(json.error ?? "Failed to load orders")
      setOrders(json.data)
    } catch (err: any) {
      console.error("fetchOrders error:", err)
      setOrdersError(err.message)
    } finally {
      setLoadingOrders(false)
    }
  }

  // ── Refund ─────────────────────────────────────────────
  async function refundOrder(orderId: string) {
    if (!selectedEventId) return
    if (!confirm("Refund this order? The seat will be released.")) return
    setRefundingId(orderId)
    try {
      const res = await fetch(
        `/api/organiser/events/${selectedEventId}/orders`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Refund failed")
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "REFUNDED" } : o))
      )
      fetchStats()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setRefundingId(null)
    }
  }

  // ── Toggle publish ─────────────────────────────────────
  async function togglePublish(eventId: string, current: boolean) {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !current }),
      })
      if (!res.ok) throw new Error("Failed to update")
      fetchStats()
    } catch {
      alert("Could not update event.")
    }
  }

  // ── Delete event ───────────────────────────────────────
  async function deleteEvent(eventId: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      if (selectedEventId === eventId) setSelectedEventId(null)
      fetchStats()
    } catch {
      alert("Could not delete event.")
    }
  }

  // ── Loading / error ────────────────────────────────────
  if (loadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">{statsError}</p>
      </div>
    )
  }

  const maxDailyRevenue = Math.max(
    ...(stats?.dailyRevenue.map((d) => d.revenue) ?? [0]),
    1
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Your events and analytics
            </p>
          </div>
          <button
            onClick={() => router.push("/organiser/events/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            + New Event
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Revenue",
              value: formatPrice(stats?.totalRevenue ?? 0),
              color: "text-green-600",
            },
            {
              label: "Tickets Sold",
              value: stats?.totalTicketsSold ?? 0,
              color: "text-blue-600",
            },
            {
              label: "Total Events",
              value: stats?.totalEvents ?? 0,
              color: "text-purple-600",
            },
            {
              label: "Published",
              value: stats?.publishedEvents ?? 0,
              color: "text-orange-500",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
            >
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                {card.label}
              </p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Revenue chart ── */}
        {stats && stats.dailyRevenue.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Revenue — Last 30 Days
            </h2>
            <div className="flex items-end gap-1 h-32">
              {stats.dailyRevenue.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className="w-full bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-600"
                    style={{
                      height: `${Math.round(
                        (day.revenue / maxDailyRevenue) * 100
                      )}%`,
                      minHeight: "4px",
                    }}
                  />
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                    {day.date}
                    <br />
                    {formatPrice(day.revenue)}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Hover over bars to see daily totals
            </p>
          </div>
        )}

        {/* ── Event list ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Your Events
            </h2>
          </div>

          {stats?.eventSummaries.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm">No events yet.</p>
              <button
                onClick={() => router.push("/organiser/events/new")}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Create your first event →
              </button>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {stats?.eventSummaries.map((event) => (
              <div key={event.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {event.title}
                      </h3>
                      <span
                        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                          event.published
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {event.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {formatDate(event.date)} · {event.venue}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                      <span>🎟 {event.ticketsSold} sold</span>
                      <span>💺 {event.capacity} capacity</span>
                      <span className="font-medium text-green-600">
                        💵 {formatPrice(event.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          event.percentSold >= 90
                            ? "bg-red-400"
                            : event.percentSold >= 60
                            ? "bg-amber-400"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${event.percentSold}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {event.percentSold}% sold
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => togglePublish(event.id, event.published)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        event.published
                          ? "border-gray-300 text-gray-600 hover:bg-gray-50"
                          : "border-blue-300 text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {event.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => fetchOrders(event.id, event.title)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        selectedEventId === event.id
                          ? "border-blue-400 bg-blue-50 text-blue-600"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Orders
                    </button>
                    <button
                      onClick={() => router.push(`/organiser/events/${event.id}`)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Orders panel ── */}
        {selectedEventId && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Orders — {selectedEventTitle}
              </h2>
              <button
                onClick={() => {
                  setSelectedEventId(null)
                  setOrders([])
                  setOrdersError(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕ Close
              </button>
            </div>

            {/* Loading */}
            {loadingOrders && (
              <div className="py-10 text-center">
                <p className="text-gray-400 text-sm">Loading orders...</p>
              </div>
            )}

            {/* Error */}
            {!loadingOrders && ordersError && (
              <div className="py-6 px-6">
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {ordersError}
                </div>
              </div>
            )}

            {/* Empty */}
            {!loadingOrders && !ordersError && orders.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-gray-400 text-sm">No orders yet.</p>
              </div>
            )}

            {/* Orders list */}
            {!loadingOrders && !ordersError && orders.length > 0 && (
              <div className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {order.user.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">{order.user.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>
                          {order.tickets
                            .map((t) => t.seat?.label ?? "GA")
                            .join(", ")}
                        </span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          order.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : order.status === "REFUNDED"
                            ? "bg-red-100 text-red-600"
                            : order.status === "CANCELLED"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.status === "PAID" && (
                        <button
                          onClick={() => refundOrder(order.id)}
                          disabled={refundingId === order.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {refundingId === order.id ? "Refunding..." : "Refund"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}