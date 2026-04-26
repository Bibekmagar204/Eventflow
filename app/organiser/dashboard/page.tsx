// app/organiser/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatPrice } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  capacity: int;
  price: number;
  published: boolean;
  createdAt: string;
  _count: { seats: number; tickets: number };
}

export default function OrganiserDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function fetchEvents() {
    try {
      const res = await fetch("/api/events?mine=true");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load events");
      setEvents(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  async function togglePublish(event: Event) {
    setTogglingId(event.id);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !event.published }),
      });
      if (!res.ok) throw new Error("Failed to update");
      // Update local state without refetching
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, published: !e.published } : e
        )
      );
    } catch (err) {
      alert("Could not update event. Please try again.");
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert("Could not delete event. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and publish your events
            </p>
          </div>
          <button
            onClick={() => router.push("/organiser/events/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            + New Event
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {events.length === 0 && !error && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-sm">No events yet.</p>
            <button
              onClick={() => router.push("/organiser/events/new")}
              className="mt-4 text-blue-600 text-sm font-medium hover:underline"
            >
              Create your first event →
            </button>
          </div>
        )}

        {/* Event cards */}
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: event info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-gray-900 truncate">
                      {event.title}
                    </h2>
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
                  <p className="text-sm text-gray-500">
                    {formatDate(event.date)} · {event.venue}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <span>🎟 {event._count.tickets} sold</span>
                    <span>💺 {event.capacity} capacity</span>
                    <span>💵 {formatPrice(event.price)}</span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublish(event)}
                    disabled={togglingId === event.id}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      event.published
                        ? "border-gray-300 text-gray-600 hover:bg-gray-50"
                        : "border-blue-300 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {togglingId === event.id
                      ? "Saving..."
                      : event.published
                      ? "Unpublish"
                      : "Publish"}
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
    </div>
  );
}