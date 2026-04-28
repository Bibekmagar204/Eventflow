"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Spinner from "react-bootstrap/Spinner"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { formatDate, formatPrice } from "@/lib/utils"

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

export interface Stats {
  totalEvents: number
  publishedEvents: number
  totalRevenue: number
  totalTicketsSold: number
  totalCapacity: number
  overallPercentSold: number
  eventSummaries: EventSummary[]
}

export interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  user: { id: string; name: string | null; email: string }
  tickets: { id: string; seat: { label: string } | null }[]
}

export interface PrefetchedEventDetail {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  date: string
  venue: string
  capacity: number
  price: number
  published: boolean
  createdAt: string
  availableSeats: number
  organiser: { name: string | null; email: string }
  _count: { seats: number; tickets: number }
}

interface EventEditForm {
  title: string
  description: string
  date: string
  venue: string
  price: string
}

interface OrganiserDashboardClientProps {
  initialStats: Stats | null
  prefetchedEventDetails: Record<string, PrefetchedEventDetail>
  prefetchedOrdersByEvent: Record<string, Order[]>
  initialError?: string | null
}

export default function OrganiserDashboardClient({
  initialStats,
  prefetchedEventDetails,
  prefetchedOrdersByEvent,
  initialError = null,
}: OrganiserDashboardClientProps) {
  const formatRevenue = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)

  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(initialStats)
  const [statsError, setStatsError] = useState<string | null>(initialError)
  const [refreshingStats, setRefreshingStats] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [ordersModalEvent, setOrdersModalEvent] = useState<{ id: string; title: string } | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [ordersSearch, setOrdersSearch] = useState("")
  const [refundingId, setRefundingId] = useState<string | null>(null)
  const [publishingEventId, setPublishingEventId] = useState<string | null>(null)
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null)
  const [refundConfirmationText, setRefundConfirmationText] = useState("")
  const [eventSearch, setEventSearch] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null)
  const [deleteModalEvent, setDeleteModalEvent] = useState<{ id: string; title: string } | null>(null)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [viewEventId, setViewEventId] = useState<string | null>(null)
  const [viewEvent, setViewEvent] = useState<PrefetchedEventDetail | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)
  const [viewEditing, setViewEditing] = useState(false)
  const [viewSaving, setViewSaving] = useState(false)
  const [viewSaveError, setViewSaveError] = useState<string | null>(null)
  const [viewImageFile, setViewImageFile] = useState<File | null>(null)
  const [viewImagePreview, setViewImagePreview] = useState<string | null>(null)
  const [viewImageUploading, setViewImageUploading] = useState(false)
  const [viewForm, setViewForm] = useState<EventEditForm>({
    title: "",
    description: "",
    date: "",
    venue: "",
    price: "",
  })
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
    capacity: "",
    price: "",
  })

  const filteredEvents =
    stats?.eventSummaries.filter((event) => {
      const query = eventSearch.trim().toLowerCase()
      if (!query) return true
      return event.title.toLowerCase().includes(query) || event.venue.toLowerCase().includes(query)
    }) ?? []

  const filteredOrders = orders.filter((order) => {
    const query = ordersSearch.trim().toLowerCase()
    if (!query) return true
    const attendeeName = (order.user.name ?? "").toLowerCase()
    const attendeeEmail = (order.user.email ?? "").toLowerCase()
    return attendeeName.includes(query) || attendeeEmail.includes(query)
  })

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      if (viewImagePreview) URL.revokeObjectURL(viewImagePreview)
    }
  }, [imagePreview, viewImagePreview])

  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(timeout)
  }, [toast])

  function openCreateModal() {
    setIsCreateModalOpen(true)
    setCreateError(null)
    setUploadError(null)
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
    setCreateError(null)
    setUploadError(null)
    setCreatingEvent(false)
    setUploadingImage(false)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setImageFile(null)
    setCreateForm({
      title: "",
      description: "",
      date: "",
      venue: "",
      capacity: "",
      price: "",
    })
  }

  function handleCreateChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setCreateForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null)
    const file = event.target.files?.[0]
    if (!file) return

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"])
    if (!allowed.has(file.type)) {
      setUploadError("Please select a JPG, PNG, or WEBP file.")
      event.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be 5MB or smaller.")
      event.target.value = ""
      return
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    setUploadError(null)
  }

  function openDeleteModal(eventId: string, eventTitle: string) {
    setDeleteModalEvent({ id: eventId, title: eventTitle })
    setDeleteConfirmationText("")
  }

  function closeDeleteModal() {
    setDeleteModalEvent(null)
    setDeleteConfirmationText("")
    setDeletingEventId(null)
  }

  async function openViewModal(eventId: string) {
    setViewEventId(eventId)
    setViewEditing(false)
    setViewSaveError(null)
    setViewLoading(true)
    setViewError(null)
    setViewEvent(null)
    const prefetched = prefetchedEventDetails[eventId]
    if (prefetched) {
      applyViewEvent(prefetched)
      setViewLoading(false)
    }
    try {
      await fetchLatestEventDetail(eventId)
    } catch (error) {
      setViewError(error instanceof Error ? error.message : "Failed to load event")
    } finally {
      setViewLoading(false)
    }
  }

  function closeViewModal() {
    setViewEventId(null)
    setViewEvent(null)
    setViewLoading(false)
    setViewError(null)
    setViewEditing(false)
    setViewSaving(false)
    setViewSaveError(null)
    setViewImageUploading(false)
    setViewImageFile(null)
    if (viewImagePreview) URL.revokeObjectURL(viewImagePreview)
    setViewImagePreview(null)
  }

  function applyViewEvent(eventData: PrefetchedEventDetail) {
    setViewEvent(eventData)
    setViewForm({
      title: eventData.title,
      description: eventData.description ?? "",
      date: new Date(eventData.date).toISOString().slice(0, 16),
      venue: eventData.venue,
      price: String(eventData.price),
    })
  }

  async function fetchLatestEventDetail(eventId: string) {
    const res = await fetch(`/api/events/${eventId}`, { cache: "no-store" })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? "Failed to load event")
    applyViewEvent(json.data as PrefetchedEventDetail)
  }

  function handleViewImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"])
    if (!allowed.has(file.type)) {
      setViewSaveError("Please select a JPG, PNG, or WEBP file.")
      event.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setViewSaveError("Image must be 5MB or smaller.")
      event.target.value = ""
      return
    }

    if (viewImagePreview) URL.revokeObjectURL(viewImagePreview)
    setViewImageFile(file)
    setViewImagePreview(URL.createObjectURL(file))
  }

  async function saveViewEdits() {
    if (!viewEvent) return
    setViewSaving(true)
    setViewSaveError(null)
    try {
      let nextImageUrl: string | undefined
      if (viewImageFile) {
        setViewImageUploading(true)
        const uploadData = new FormData()
        uploadData.append("file", viewImageFile)

        const uploadRes = await fetch("/api/uploads/event-image", {
          method: "POST",
          body: uploadData,
        })
        const uploadJson = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadJson.error ?? "Image upload failed.")
        nextImageUrl = uploadJson.data?.imageUrl
      }

      const res = await fetch(`/api/events/${viewEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: viewForm.title,
          description: viewForm.description,
          date: new Date(viewForm.date).toISOString(),
          venue: viewForm.venue,
          price: parseFloat(viewForm.price),
          ...(nextImageUrl ? { imageUrl: nextImageUrl } : {}),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save changes")

      setViewEvent((prev) =>
        prev
          ? {
              ...prev,
              title: json.data.title,
              description: json.data.description,
              date: json.data.date,
              venue: json.data.venue,
              price: json.data.price,
              imageUrl: nextImageUrl ?? prev.imageUrl,
            }
          : prev
      )
      await fetchStats()
      await fetchLatestEventDetail(viewEvent.id)
      router.refresh()
      setViewEditing(false)
      setViewImageFile(null)
      if (viewImagePreview) URL.revokeObjectURL(viewImagePreview)
      setViewImagePreview(null)
      setToast({ message: "Event updated successfully", tone: "success" })
    } catch (error) {
      setViewSaveError(error instanceof Error ? error.message : "Failed to save changes")
      setToast({ message: "Failed please contact support", tone: "error" })
    } finally {
      setViewImageUploading(false)
      setViewSaving(false)
    }
  }

  async function submitCreateEvent(event: React.FormEvent) {
    event.preventDefault()
    setCreateError(null)
    setUploadError(null)
    setCreatingEvent(true)

    try {
      let imageUrl: string | undefined

      if (imageFile) {
        setUploadingImage(true)
        const uploadData = new FormData()
        uploadData.append("file", imageFile)

        const uploadRes = await fetch("/api/uploads/event-image", {
          method: "POST",
          body: uploadData,
        })
        const uploadJson = await uploadRes.json()
        if (!uploadRes.ok) {
          setUploadError(uploadJson.error ?? "Image upload failed.")
          return
        }
        imageUrl = uploadJson.data?.imageUrl
      }

      const createRes = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          date: new Date(createForm.date).toISOString(),
          venue: createForm.venue,
          capacity: parseInt(createForm.capacity, 10),
          price: parseFloat(createForm.price),
          imageUrl,
        }),
      })

      const createJson = await createRes.json()
      if (!createRes.ok) {
        const firstError =
          typeof createJson.error === "string"
            ? createJson.error
            : Object.values(createJson.error as Record<string, string[]>)
                .flat()
                .join(", ")
        setCreateError(firstError)
        return
      }

      await fetchStats()
      closeCreateModal()
    } catch {
      setCreateError("Something went wrong. Please try again.")
    } finally {
      setUploadingImage(false)
      setCreatingEvent(false)
    }
  }

  async function fetchStats() {
    setRefreshingStats(true)
    setStatsError(null)
    try {
      const res = await fetch("/api/organiser/stats")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to load stats")
      setStats(json.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load stats"
      setStatsError(message)
    } finally {
      setRefreshingStats(false)
    }
  }

  async function fetchOrders(eventId: string, eventTitle: string) {
    setOrdersModalEvent({ id: eventId, title: eventTitle })
    setSelectedEventId(eventId)
    setOrdersSearch("")
    setLoadingOrders(true)
    setOrdersError(null)
    setOrders([])

    const prefetchedOrders = prefetchedOrdersByEvent[eventId]
    if (prefetchedOrders) {
      setOrders(prefetchedOrders)
      setLoadingOrders(false)
    }

    try {
      const res = await fetch(`/api/organiser/events/${eventId}/orders`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to load orders")
      setOrders(json.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load orders"
      setOrdersError(message)
    } finally {
      setLoadingOrders(false)
    }
  }

  function closeOrdersModal() {
    setOrdersModalEvent(null)
    setSelectedEventId(null)
    setOrdersSearch("")
    setRefundModalOrder(null)
    setRefundConfirmationText("")
    setOrders([])
    setOrdersError(null)
    setLoadingOrders(false)
  }

  function openRefundModal(order: Order) {
    setRefundModalOrder(order)
    setRefundConfirmationText("")
  }

  function closeRefundModal() {
    setRefundModalOrder(null)
    setRefundConfirmationText("")
  }

  async function refundOrder(orderId: string) {
    if (!selectedEventId) return
    setRefundingId(orderId)
    try {
      const res = await fetch(`/api/organiser/events/${selectedEventId}/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Refund failed")

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "REFUNDED" } : o)))
      await fetchStats()
      setToast({ message: "Order refunded successfully", tone: "success" })
      closeRefundModal()
    } catch (error) {
      setToast({ message: "Failed please contact support", tone: "error" })
    } finally {
      setRefundingId(null)
    }
  }

  async function togglePublish(eventId: string, current: boolean) {
    setPublishingEventId(eventId)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !current }),
      })
      if (!res.ok) throw new Error("Failed to update")
      await fetchStats()
      setToast({
        message: current ? "Event unpublished successfully" : "Event published successfully",
        tone: "success",
      })
    } catch {
      setToast({ message: "Failed please contact support", tone: "error" })
    } finally {
      setPublishingEventId(null)
    }
  }

  async function deleteEvent(eventId: string) {
    try {
      setDeletingEventId(eventId)
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      if (selectedEventId === eventId) setSelectedEventId(null)
      await fetchStats()
      setToast({ message: "Event deleted successfully", tone: "success" })
      closeDeleteModal()
    } catch {
      setToast({ message: "Failed please contact support", tone: "error" })
      setDeletingEventId(null)
    }
  }

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[#1f1f1f]">
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-5 z-[60] flex justify-center px-4">
          <div
            className={`animate-toast-drop rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
              toast.tone === "success"
                ? "border border-emerald-300 bg-emerald-100 text-emerald-900"
                : "border border-red-300 bg-red-100 text-red-900"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
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
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-hero)]">Dashboard</h1>
              <p className="mt-1 text-sm text-[color:var(--text-muted-light)]">Your events and analytics</p>
            </div>
            <button
              onClick={openCreateModal}
              className="btn-liquid rounded-lg border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)]"
            >
              <span className="btn-liquid-label">+ New Event</span>
            </button>
          </div>

          {statsError && (
            <div className="rounded-lg border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
              {statsError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total Revenue", value: formatPrice(stats?.totalRevenue ?? 0) },
              { label: "Tickets Sold", value: stats?.totalTicketsSold ?? 0 },
              { label: "Total Events", value: stats?.totalEvents ?? 0 },
              { label: "Published", value: stats?.publishedEvents ?? 0 },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.62)] p-5 shadow-sm backdrop-blur"
              >
                <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">{card.label}</p>
                <p className="text-2xl font-bold text-[var(--text-hero)]">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.62)] shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-[var(--text-light)]">Your Events</h2>
              <input
                type="text"
                value={eventSearch}
                onChange={(event) => setEventSearch(event.target.value)}
                placeholder="Search events..."
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none placeholder:text-[color:var(--text-muted-light)] focus:border-[var(--text-hero)] sm:max-w-xs"
              />
            </div>

            {stats?.eventSummaries.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-sm text-[color:var(--text-muted-light)]">No events yet.</p>
                <button
                  onClick={openCreateModal}
                  className="mt-3 text-sm text-[var(--text-hero)] hover:underline"
                >
                  Create your first event →
                </button>
              </div>
            )}

            {stats?.eventSummaries.length !== 0 && filteredEvents.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-[color:var(--text-muted-light)]">No events match your search.</p>
              </div>
            )}

            <div className="divide-y divide-white/10">
              {filteredEvents.map((event) => (
                <div key={event.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-[var(--text-light)]">{event.title}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            event.published ? "bg-green-200 text-green-900" : "bg-white/15 text-[var(--text-light)]"
                          }`}
                        >
                          {event.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="mb-3 text-xs text-[color:var(--text-muted-light)]">
                        {formatDate(event.date)} - {event.venue}
                      </p>
                      <div className="mb-3 flex items-center gap-4 text-xs text-[color:var(--text-muted-light)]">
                        <span>🎟 {event.ticketsSold} sold</span>
                        <span>💺 {event.capacity} capacity</span>
                        <span className="font-medium text-[var(--text-hero)]">💵 Revenue: {formatRevenue(event.revenue)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10">
                        <div
                          className={`h-1.5 rounded-full ${
                            event.percentSold >= 90
                              ? "bg-red-400"
                              : event.percentSold >= 60
                                ? "bg-amber-400"
                                : "bg-[var(--text-hero)]"
                          }`}
                          style={{ width: `${event.percentSold}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--text-muted-light)]">{event.percentSold}% sold</p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        onClick={() => togglePublish(event.id, event.published)}
                        disabled={publishingEventId === event.id}
                        className="min-w-[110px] rounded-lg border border-white/20 px-3 py-1.5 text-center text-xs font-medium text-[var(--text-light)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="inline-flex items-center justify-center gap-1">
                          {publishingEventId === event.id && (
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="!h-3 !w-3 animate-spin rounded-full border-2 border-current border-r-transparent"
                            />
                          )}
                          {publishingEventId !== event.id && (event.published ? "Unpublish" : "Publish")}
                        </span>
                      </button>
                      <button
                        onClick={() => fetchOrders(event.id, event.title)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          selectedEventId === event.id
                            ? "border-[var(--text-hero)] bg-[var(--text-hero)]/20 text-[var(--text-hero)]"
                            : "border-white/20 text-[var(--text-light)] hover:bg-white/10"
                        }`}
                      >
                        Orders
                      </button>
                      <button
                        onClick={() => openViewModal(event.id)}
                        className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-[var(--text-light)] transition hover:bg-white/10"
                      >
                        View/Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(event.id, event.title)}
                        className="rounded-lg border border-red-400/50 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {ordersModalEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
              <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.95)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                  <h2 className="text-base font-semibold text-[var(--text-light)]">Orders - {ordersModalEvent.title}</h2>
                  <button
                    onClick={closeOrdersModal}
                    className="text-sm text-[color:var(--text-muted-light)] hover:text-[var(--text-light)]"
                  >
                    ✕ Close
                  </button>
                </div>

                {!loadingOrders && !ordersError && orders.length > 0 && (
                  <div className="border-b border-white/10 px-6 py-4">
                    <input
                      type="text"
                      value={ordersSearch}
                      onChange={(event) => setOrdersSearch(event.target.value)}
                      placeholder="Search attendee by name or email..."
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none placeholder:text-[color:var(--text-muted-light)] focus:border-[var(--text-hero)]"
                    />
                  </div>
                )}

                {loadingOrders ? (
                  <div className="animate-pulse space-y-3 px-6 py-6">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="h-4 w-40 rounded bg-white/10" />
                        <div className="mt-2 h-3 w-56 rounded bg-white/10" />
                        <div className="mt-3 h-3 w-48 rounded bg-white/10" />
                      </div>
                    ))}
                  </div>
                ) : ordersError ? (
                  <div className="px-6 py-6">
                    <div className="rounded-lg border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
                      {ordersError}
                    </div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-[color:var(--text-muted-light)]">No orders yet.</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-[color:var(--text-muted-light)]">No attendees matched your search.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between gap-4 px-6 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--text-light)]">{order.user.name ?? "Unknown"}</p>
                          <p className="text-xs text-[color:var(--text-muted-light)]">{order.user.email}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-[color:var(--text-muted-light)]">
                            <span>{order.tickets.map((t) => t.seat?.label ?? "GA").join(", ")}</span>
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-sm font-semibold text-[var(--text-hero)]">{formatPrice(order.total)}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              order.status === "PAID"
                                ? "bg-green-200 text-green-900"
                                : order.status === "REFUNDED"
                                  ? "bg-red-200 text-red-900"
                                  : order.status === "CANCELLED"
                                    ? "bg-white/15 text-[var(--text-light)]"
                                    : "bg-amber-200 text-amber-900"
                            }`}
                          >
                            {order.status}
                          </span>
                          {order.status === "PAID" && (
                            <button
                              onClick={() => openRefundModal(order)}
                              disabled={refundingId === order.id}
                              className="rounded-lg border border-red-400/50 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
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
            </div>
          )}

          {refundModalOrder && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.98)] p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-[var(--text-light)]">Confirm Refund</h3>
                <p className="mt-2 text-sm text-[color:var(--text-muted-light)]">
                  Make sure to verify you&apos;re refunding the correct person.
                </p>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                  <p className="text-[var(--text-light)]">{refundModalOrder.user.name ?? "Unknown"}</p>
                  <p className="text-[color:var(--text-muted-light)]">{refundModalOrder.user.email}</p>
                  <p className="mt-2 text-[var(--text-hero)]">{formatPrice(refundModalOrder.total)}</p>
                </div>

                <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted-light)]">
                  Type refund to confirm
                </label>
                <input
                  type="text"
                  value={refundConfirmationText}
                  onChange={(event) => setRefundConfirmationText(event.target.value)}
                  placeholder="refund"
                  className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none placeholder:text-[color:var(--text-muted-light)] focus:border-[var(--text-hero)]"
                />

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeRefundModal}
                    className="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium text-[var(--text-light)] transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => refundOrder(refundModalOrder.id)}
                    disabled={refundConfirmationText.trim().toLowerCase() !== "refund" || refundingId === refundModalOrder.id}
                    className="rounded-lg border border-red-400/60 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {refundingId === refundModalOrder.id ? "Refunding..." : "Confirm Refund"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.95)] p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={closeCreateModal}
              className="absolute right-4 top-4 rounded-md px-2 py-1 text-xs text-[color:var(--text-muted-light)] hover:bg-white/10 hover:text-[var(--text-light)]"
            >
              ✕
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-hero)]">Create New Event</h2>
              <p className="mt-1 text-sm text-[color:var(--text-muted-light)]">
                Fill in the details below. You can publish the event from your dashboard.
              </p>
            </div>

            {createError && (
              <div className="mb-4 rounded-lg border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
                {createError}
              </div>
            )}
            {uploadError && (
              <div className="mb-4 rounded-lg border border-amber-300/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-200">
                {uploadError}
              </div>
            )}

            <form onSubmit={submitCreateEvent} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-light)]">
                  Event Title <span className="text-red-300">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Spring Music Festival"
                  value={createForm.title}
                  onChange={handleCreateChange}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none placeholder:text-[color:var(--text-muted-light)] focus:border-[var(--text-hero)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-light)]">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Tell attendees what to expect..."
                  value={createForm.description}
                  onChange={handleCreateChange}
                  className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none placeholder:text-[color:var(--text-muted-light)] focus:border-[var(--text-hero)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-light)]">
                  Date & Time <span className="text-red-300">*</span>
                </label>
                <input
                  name="date"
                  type="datetime-local"
                  required
                  value={createForm.date}
                  onChange={handleCreateChange}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none focus:border-[var(--text-hero)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-light)]">
                  Venue <span className="text-red-300">*</span>
                </label>
                <input
                  name="venue"
                  type="text"
                  required
                  placeholder="e.g. Austin Convention Center"
                  value={createForm.venue}
                  onChange={handleCreateChange}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none placeholder:text-[color:var(--text-muted-light)] focus:border-[var(--text-hero)]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-light)]">
                    Capacity <span className="text-red-300">*</span>
                  </label>
                  <input
                    name="capacity"
                    type="number"
                    required
                    min={1}
                    placeholder="100"
                    value={createForm.capacity}
                    onChange={handleCreateChange}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none placeholder:text-[color:var(--text-muted-light)] focus:border-[var(--text-hero)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-light)]">
                    Ticket Price ($) <span className="text-red-300">*</span>
                  </label>
                  <input
                    name="price"
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={createForm.price}
                    onChange={handleCreateChange}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none placeholder:text-[color:var(--text-muted-light)] focus:border-[var(--text-hero)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-light)]">Event Image</label>
                <input
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] file:mr-3 file:rounded-md file:border-0 file:bg-white/15 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--text-light)] hover:file:bg-white/25"
                />
                <p className="mt-1 text-xs text-[color:var(--text-muted-light)]">
                  Optional. JPG, PNG, or WEBP up to 5MB.
                </p>
                {imagePreview && (
                  <div className="mt-3 rounded-xl border border-white/15 p-3">
                    <Image
                      src={imagePreview}
                      alt="Selected event image preview"
                      width={768}
                      height={320}
                      className="h-40 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="mt-2 text-xs font-medium text-red-300 hover:text-red-200"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <button
                  type="submit"
                  disabled={creatingEvent || uploadingImage}
                  className="btn-liquid flex flex-1 items-center justify-center gap-2 rounded-lg border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingImage || creatingEvent ? (
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="!h-4 !w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                    />
                  ) : (
                    <span className="btn-liquid-label">Create Event</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="btn-liquid flex flex-1 items-center justify-center rounded-lg border border-red-400/50 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/25"
                >
                  <span className="btn-liquid-label">Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.95)] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[var(--text-hero)]">Are you sure?</h3>
            <p className="mt-2 text-sm text-[color:var(--text-muted-light)]">
              This will permanently delete <span className="font-medium text-[var(--text-light)]">{deleteModalEvent.title}</span>.
            </p>
            <p className="mt-3 text-sm text-[color:var(--text-muted-light)]">
              Type <span className="font-semibold text-red-300">delete</span> to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(event) => setDeleteConfirmationText(event.target.value)}
              placeholder="Type delete"
              className="mt-3 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none placeholder:text-[color:var(--text-muted-light)] focus:border-red-300"
            />

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="btn-liquid flex flex-1 items-center justify-center rounded-lg border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)]"
              >
                <span className="btn-liquid-label">Cancel</span>
              </button>
              <button
                type="button"
                onClick={() => deleteEvent(deleteModalEvent.id)}
                disabled={deleteConfirmationText.trim().toLowerCase() !== "delete" || deletingEventId === deleteModalEvent.id}
                className="btn-liquid flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-400/50 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingEventId === deleteModalEvent.id ? (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="!h-4 !w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                  />
                ) : (
                  <span className="btn-liquid-label">Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {viewEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.95)] p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={closeViewModal}
              className="absolute right-4 top-4 rounded-md px-3 py-2 text-sm font-medium text-[color:var(--text-muted-light)] hover:bg-white/10 hover:text-[var(--text-light)]"
            >
              ✕
            </button>

            {viewLoading ? (
              <div className="min-h-[640px] animate-pulse space-y-6">
                <div className="space-y-2">
                  <div className="h-8 w-2/5 rounded bg-white/10" />
                  <div className="h-4 w-1/3 rounded bg-white/10" />
                </div>
                <div className="h-10 w-24 rounded-lg bg-white/10" />
                <div className="h-56 w-full rounded-xl bg-white/10" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2 rounded-lg border border-white/10 p-3">
                    <div className="h-3 w-20 rounded bg-white/10" />
                    <div className="h-4 w-32 rounded bg-white/10" />
                  </div>
                  <div className="space-y-2 rounded-lg border border-white/10 p-3">
                    <div className="h-3 w-16 rounded bg-white/10" />
                    <div className="h-4 w-28 rounded bg-white/10" />
                  </div>
                  <div className="space-y-2 rounded-lg border border-white/10 p-3">
                    <div className="h-3 w-20 rounded bg-white/10" />
                    <div className="h-4 w-24 rounded bg-white/10" />
                  </div>
                  <div className="space-y-2 rounded-lg border border-white/10 p-3">
                    <div className="h-3 w-16 rounded bg-white/10" />
                    <div className="h-4 w-20 rounded bg-white/10" />
                  </div>
                </div>
                <div className="h-16 rounded bg-white/10" />
                <div className="h-24 rounded-xl border border-white/10 bg-white/10" />
              </div>
            ) : viewError || !viewEvent ? (
              <p className="text-sm text-red-300">{viewError ?? "Event not found"}</p>
            ) : (
              <div className="min-h-[640px] space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold text-[var(--text-hero)]">{viewEvent.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          viewEvent.published ? "bg-green-200 text-green-900" : "bg-white/15 text-[var(--text-light)]"
                        }`}
                      >
                        {viewEvent.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--text-muted-light)]">Created {formatDate(viewEvent.createdAt)}</p>
                  </div>
                </div>

                {!viewEditing && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setViewEditing(true)
                        setViewSaveError(null)
                        setViewForm({
                          title: viewEvent.title,
                          description: viewEvent.description ?? "",
                          date: new Date(viewEvent.date).toISOString().slice(0, 16),
                          venue: viewEvent.venue,
                          price: String(viewEvent.price),
                        })
                      }}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-[var(--text-light)] transition hover:bg-white/10"
                    >
                      Edit
                    </button>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border border-white/15 bg-[rgba(255,255,255,0.04)]">
                  <div className="group relative">
                    {viewImagePreview || viewEvent.imageUrl ? (
                      <Image
                        src={viewImagePreview ?? viewEvent.imageUrl ?? ""}
                        alt={`${viewEvent.title} image`}
                        width={1200}
                        height={500}
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center bg-[linear-gradient(135deg,rgba(246,233,207,0.2),rgba(255,255,255,0.06))]">
                        <p className="text-sm text-[color:var(--text-muted-light)]">No image uploaded</p>
                      </div>
                    )}

                    {viewEditing && (
                      <>
                        <label
                          htmlFor="view-image-upload"
                          className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/30 bg-black/55 px-3 py-2 text-xs font-medium text-[var(--text-light)] transition hover:bg-black/70"
                        >
                          <span aria-hidden="true">🖼</span>
                          Change image
                        </label>
                        <input
                          id="view-image-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleViewImageChange}
                          className="sr-only"
                        />
                      </>
                    )}
                    {viewEditing && viewImageFile && (
                      <p className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-[var(--text-light)]">
                        New image selected
                      </p>
                    )}
                    {viewImageUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <p className="text-sm font-medium text-[var(--text-light)]">Uploading image...</p>
                      </div>
                    )}
                  </div>
                  {viewEditing && (
                    <div className="border-t border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-xs text-[color:var(--text-muted-light)]">JPG, PNG, or WEBP up to 5MB.</p>
                    </div>
                  )}
                </div>

                {viewEditing ? (
                  <div className="space-y-4">
                    {viewSaveError && (
                      <div className="rounded-lg border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
                        {viewSaveError}
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
                        Title
                      </label>
                      <input
                        type="text"
                        value={viewForm.title}
                        onChange={(event) => setViewForm((prev) => ({ ...prev, title: event.target.value }))}
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none focus:border-[var(--text-hero)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={viewForm.description}
                        onChange={(event) =>
                          setViewForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none focus:border-[var(--text-hero)]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
                          Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={viewForm.date}
                          onChange={(event) => setViewForm((prev) => ({ ...prev, date: event.target.value }))}
                          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none focus:border-[var(--text-hero)]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
                          Venue
                        </label>
                        <input
                          type="text"
                          value={viewForm.venue}
                          onChange={(event) => setViewForm((prev) => ({ ...prev, venue: event.target.value }))}
                          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none focus:border-[var(--text-hero)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
                        Ticket Price ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={viewForm.price}
                        onChange={(event) => setViewForm((prev) => ({ ...prev, price: event.target.value }))}
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[var(--text-light)] outline-none focus:border-[var(--text-hero)]"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={saveViewEdits}
                        disabled={viewSaving || viewImageUploading}
                        className="btn-liquid flex flex-1 items-center justify-center gap-2 rounded-lg border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {viewSaving || viewImageUploading ? (
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="!h-4 !w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                          />
                        ) : (
                          <span className="btn-liquid-label">Save Changes</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setViewEditing(false)
                          setViewSaveError(null)
                        }}
                        className="btn-liquid flex flex-1 items-center justify-center rounded-lg border border-red-400/50 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/25"
                      >
                        <span className="btn-liquid-label">Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">Date & Time</p>
                        <p className="text-[var(--text-light)]">{formatDate(viewEvent.date)}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">Venue</p>
                        <p className="text-[var(--text-light)]">{viewEvent.venue}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">Ticket Price</p>
                        <p className="text-[var(--text-light)]">{formatPrice(viewEvent.price)}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">Capacity</p>
                        <p className="text-[var(--text-light)]">{viewEvent.capacity} seats</p>
                      </div>
                    </div>

                    {viewEvent.description && (
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">Description</p>
                        <p className="text-sm text-[var(--text-light)]">{viewEvent.description}</p>
                      </div>
                    )}
                  </>
                )}

                <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                  <p className="mb-2 text-sm font-medium text-[var(--text-light)]">Ticket Sales</p>
                  <p className="text-sm text-[color:var(--text-muted-light)]">
                    {viewEvent._count.tickets} sold · {viewEvent.availableSeats} remaining
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-hero)]">
                    Estimated revenue: {formatPrice(viewEvent._count.tickets * viewEvent.price)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <Footer tone="dark" />
    </main>
  )
}
