// app/attendee/events/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { formatDate, formatPrice } from "@/lib/utils";

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  date: string;
  venue: string;
  capacity: number;
  price: number;
  published: boolean;
  availableSeats: number;
  organiser: { name: string | null; email: string };
  _count: { seats: number; tickets: number };
}

export default function AttendeeEventDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load event");
        // Block attendees from viewing unpublished events
        if (!json.data.published) {
          router.replace("/attendee/events");
          return;
        }
        setEvent(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-sm">{error ?? "Event not found"}</p>
          <button
            onClick={() => router.push("/attendee/events")}
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            ← Back to events
          </button>
        </div>
      </div>
    );
  }

  const soldOut = event._count.tickets >= event.capacity;
  const seatsLeft = event.availableSeats;
  const soldPercent = Math.round(
    ((event.capacity - seatsLeft) / event.capacity) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back link */}
        <button
          onClick={() => router.push("/attendee/events")}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back to events
        </button>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

          {/* Sold out banner */}
          {soldOut && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              This event is sold out.
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {event.title}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Organised by {event.organiser.name ?? "Unknown"}
          </p>

          {/* Event meta grid */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Date & Time
              </p>
              <p>{formatDate(event.date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Venue
              </p>
              <p>{event.venue}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Ticket Price
              </p>
              <p className="font-semibold text-gray-900">
                {formatPrice(event.price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Availability
              </p>
              <p
                className={
                  soldOut
                    ? "text-red-600 font-medium"
                    : seatsLeft <= 10
                    ? "text-amber-600 font-medium"
                    : "text-green-600 font-medium"
                }
              >
                {soldOut ? "Sold out" : `${seatsLeft} seats left`}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                About this event
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Capacity progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{event.capacity - seatsLeft} sold</span>
              <span>{event.capacity} total</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  soldOut
                    ? "bg-red-400"
                    : seatsLeft <= 10
                    ? "bg-amber-400"
                    : "bg-blue-500"
                }`}
                style={{ width: `${soldPercent}%` }}
              />
            </div>
          </div>

          {/* Buy ticket button — wired up in Module 3 */}
          <button
            disabled={soldOut}
            onClick={() => router.push(`/attendee/events/${id}/purchase`)}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
              soldOut
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {soldOut ? "Sold Out" : `Buy Ticket — ${formatPrice(event.price)}`}
          </button>

          {!soldOut && (
            <p className="text-xs text-gray-400 text-center mt-3">
              You will be asked to confirm before payment is taken.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}