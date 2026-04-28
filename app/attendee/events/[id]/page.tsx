// app/attendee/events/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { formatDate, formatPrice } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  imageUrl?: string | null;
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
      <main className="flex min-h-screen flex-col bg-[#1f1f1f] text-[var(--text-light)]">
        <Navbar variant="transparent" />
        <div className="flex flex-1 items-center justify-center pt-24">
          <p className="text-sm text-[color:var(--text-muted-light)]">Loading event...</p>
        </div>
        <Footer tone="dark" />
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="flex min-h-screen flex-col bg-[#1f1f1f] text-[var(--text-light)]">
        <Navbar variant="transparent" />
        <div className="flex flex-1 items-center justify-center px-4 pt-24">
          <div className="text-center">
            <p className="text-sm text-red-300">{error ?? "Event not found"}</p>
            <button
              onClick={() => router.push("/attendee/events")}
              className="mt-4 text-sm text-[var(--text-light)] hover:underline"
            >
              ← Back to events
            </button>
          </div>
        </div>
        <Footer tone="dark" />
      </main>
    );
  }

  const soldOut = event._count.tickets >= event.capacity;
  const seatsLeft = event.availableSeats;
  const soldPercent = Math.round(
    ((event.capacity - seatsLeft) / event.capacity) * 100
  );

  return (
    <main className="flex min-h-screen flex-col bg-[#1f1f1f] text-[var(--text-light)]">
      <Navbar variant="transparent" />
      <div className="flex-1 px-4 py-10 pt-24">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Back link */}
          <button
            onClick={() => router.push("/attendee/events")}
            className="flex items-center gap-1 text-sm text-[color:var(--text-muted-light)] hover:text-[var(--text-light)]"
          >
            ← Back to events
          </button>

          {/* Main card */}
          <div className="rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.62)] p-8 shadow-sm backdrop-blur">

            {/* Sold out banner */}
            {soldOut && (
              <div className="mb-4 rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-200">
                This event is sold out.
              </div>
            )}

            {/* Title + image */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="mb-1 text-2xl font-bold text-[var(--text-hero)]">{event.title}</h1>
                <p className="text-sm text-[color:var(--text-muted-light)]">
                  Organised by {event.organiser.name ?? "Unknown"}
                </p>
              </div>
              <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5">
                {event.imageUrl ? (
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950" />
                )}
              </div>
            </div>

            {/* Event meta grid */}
            <div className="mb-6 grid grid-cols-2 gap-4 text-sm text-[color:var(--text-light)]">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
                  Date & Time
                </p>
                <p>{formatDate(event.date)}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
                  Venue
                </p>
                <p>{event.venue}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
                  Ticket Price
                </p>
                <p className="font-semibold text-[var(--text-hero)]">{formatPrice(event.price)}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
                  Availability
                </p>
                <p
                  className={
                    soldOut
                      ? "font-medium text-red-300"
                      : seatsLeft <= 10
                      ? "font-medium text-amber-300"
                      : "font-medium text-emerald-300"
                  }
                >
                  {soldOut ? "Sold out" : `${seatsLeft} seats left`}
                </p>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <p className="mb-2 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
                  About this event
                </p>
                <p className="text-sm leading-relaxed text-[color:var(--text-muted-light)]">{event.description}</p>
              </div>
            )}

            {/* Capacity progress bar */}
            <div className="mb-6">
              <div className="mb-1 flex justify-between text-xs text-[color:var(--text-muted-light)]">
                <span>{event.capacity - seatsLeft} sold</span>
                <span>{event.capacity} total</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className={`h-2 rounded-full transition-all ${
                    soldOut
                      ? "bg-red-400"
                      : seatsLeft <= 10
                      ? "bg-amber-400"
                      : "bg-[var(--text-hero)]"
                  }`}
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
            </div>

            {/* Buy ticket button — wired up in Module 3 */}
            <button
              disabled={soldOut}
              onClick={() => router.push(`/attendee/events/${id}/purchase`)}
              className={`w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
                soldOut
                  ? "cursor-not-allowed bg-white/10 text-white/40"
                  : "btn-liquid border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] text-stone-900 hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)]"
              }`}
            >
              {soldOut ? "Sold Out" : <span className="btn-liquid-label">{`Buy Ticket — ${formatPrice(event.price)}`}</span>}
            </button>

            {!soldOut && (
              <p className="mt-3 text-center text-xs text-[color:var(--text-muted-light)]">
                You will be asked to confirm before payment is taken.
              </p>
            )}
          </div>
        </div>
      </div>
      <Footer tone="dark" />
    </main>
  );
}