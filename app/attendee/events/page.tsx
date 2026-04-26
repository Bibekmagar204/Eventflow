// app/attendee/events/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatPrice } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  venue: string;
  capacity: number;
  price: number;
  published: boolean;
  organiser: { name: string | null };
  _count: { seats: number; tickets: number };
}

export default function AttendeeEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load events");
        // Only show published events on attendee side
        setEvents(json.data.filter((e: Event) => e.published));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Client-side search filter
  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Browse Events</h1>
          <p className="text-sm text-gray-500 mt-1">
            Find and book tickets for upcoming events
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by event name or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && !error && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-sm">
              {search ? "No events match your search." : "No events available yet."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Event grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((event) => {
            const soldOut = event._count.tickets >= event.capacity;

            return (
              <div
                key={event.id}
                onClick={() => !soldOut && router.push(`/attendee/events/${event.id}`)}
                className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-all ${
                  soldOut
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:shadow-md hover:border-blue-200 cursor-pointer"
                }`}
              >
                {/* Sold out banner */}
                {soldOut && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      Sold Out
                    </span>
                  </div>
                )}

                {/* Title */}
                <h2 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                  {event.title}
                </h2>

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {event.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>📅 {formatDate(event.date)}</p>
                  <p>📍 {event.venue}</p>
                  <p>👤 {event.organiser.name ?? "Organiser"}</p>
                </div>

                {/* Footer: price + seats left */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-base font-bold text-gray-900">
                    {formatPrice(event.price)}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      soldOut
                        ? "bg-red-100 text-red-600"
                        : event.capacity - event._count.tickets <= 10
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {soldOut
                      ? "Sold out"
                      : `${event.capacity - event._count.tickets} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}