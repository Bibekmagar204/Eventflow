"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateQR } from "@/lib/qr";
import { formatDate, formatPrice } from "@/lib/utils";
import EventCard, { EventCardData } from "@/components/events/EventCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TicketDetailModal from "@/components/attendee/TicketDetailModal";
import type { TicketDetail } from "@/components/attendee/MyTicketsClient";

export interface AttendeeEvent extends EventCardData {
  published: boolean;
}

export interface AttendeeEventDetail {
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

type PurchaseState = "idle" | "loading" | "success" | "error";

interface AttendeeEventsClientProps {
  initialEvents: AttendeeEvent[];
  prefetchedEventDetails: Record<string, AttendeeEventDetail>;
  initialError?: string;
}

export default function AttendeeEventsClient({
  initialEvents,
  prefetchedEventDetails,
  initialError,
}: AttendeeEventsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AttendeeEventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isPurchasePanelOpen, setIsPurchasePanelOpen] = useState(false);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>("idle");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasedTicketId, setPurchasedTicketId] = useState<string | null>(null);
  const [ticketModalLoading, setTicketModalLoading] = useState(false);
  const [ticketModalError, setTicketModalError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      initialEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.venue.toLowerCase().includes(search.toLowerCase())
      ),
    [initialEvents, search]
  );

  async function openEventModal(eventId: string) {
    setSelectedEventId(eventId);
    setDetailError(null);
    setSelectedEvent(null);
    setDetailLoading(true);
    setIsPurchasePanelOpen(false);
    setPurchaseState("idle");
    setPurchaseError(null);
    setPurchasedTicketId(null);

    const prefetched = prefetchedEventDetails[eventId];
    if (prefetched) {
      setSelectedEvent(prefetched);
      setDetailLoading(false);
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load event");
      if (!json.data.published) throw new Error("This event is no longer available.");
      setSelectedEvent(json.data);
    } catch (error: any) {
      setDetailError(error.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeEventModal() {
    setSelectedEventId(null);
    setSelectedEvent(null);
    setDetailLoading(false);
    setDetailError(null);
    setIsPurchasePanelOpen(false);
    setPurchaseState("idle");
    setPurchaseError(null);
    setPurchasedTicketId(null);
    setTicketModalLoading(false);
    setTicketModalError(null);
    setSelectedTicket(null);
    setTicketQrDataUrl(null);
  }

  function openPurchasePanel() {
    setIsPurchasePanelOpen(true);
    setPurchaseState("idle");
    setPurchaseError(null);
    setPurchasedTicketId(null);
  }

  function closePurchasePanel() {
    setIsPurchasePanelOpen(false);
    setPurchaseState("idle");
    setPurchaseError(null);
    setPurchasedTicketId(null);
  }

  async function handlePurchaseConfirm() {
    if (!selectedEvent) return;
    setPurchaseState("loading");
    setPurchaseError(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Purchase failed");
      setPurchasedTicketId(json.data.id);
      setPurchaseState("success");
    } catch (error: any) {
      setPurchaseError(error.message ?? "Purchase failed");
      setPurchaseState("error");
    }
  }

  async function openPurchasedTicketModal(ticketId: string) {
    setTicketModalLoading(true);
    setTicketModalError(null);
    setSelectedTicket(null);
    setTicketQrDataUrl(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load ticket");
      setSelectedTicket(json.data);
    } catch (error: any) {
      setTicketModalError(error.message ?? "Failed to load ticket");
    } finally {
      setTicketModalLoading(false);
    }
  }

  function closeTicketModal() {
    setTicketModalLoading(false);
    setTicketModalError(null);
    setSelectedTicket(null);
    setTicketQrDataUrl(null);
  }

  useEffect(() => {
    let active = true;
    async function buildQr() {
      if (!selectedTicket) return;
      const url = await generateQR(selectedTicket.qrCode);
      if (active) setTicketQrDataUrl(url);
    }
    setTicketQrDataUrl(null);
    buildQr();
    return () => {
      active = false;
    };
  }, [selectedTicket]);

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
              radial-gradient(1.5px 1.5px at 22% 75%, rgba(243, 240, 232, 0.45), transparent 65%),
              radial-gradient(1.5px 1.5px at 68% 82%, rgba(243, 240, 232, 0.5), transparent 65%),
              radial-gradient(2px 2px at 90% 58%, rgba(243, 240, 232, 0.4), transparent 65%),
              radial-gradient(1.5px 1.5px at 38% 44%, rgba(243, 240, 232, 0.35), transparent 65%),
              radial-gradient(1.5px 1.5px at 56% 63%, rgba(243, 240, 232, 0.35), transparent 65%)
            `,
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-8 rounded-3xl border border-white/15 bg-[rgba(20,18,28,0.58)] p-6 shadow-sm backdrop-blur sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-muted-light)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-hero)]" />
              Event discovery
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-hero)] md:text-4xl">
              Browse events
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--text-muted-light)] md:text-base">
              Find and book upcoming experiences with a clean, immersive event discovery feed.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[var(--text-light)]">
                {initialEvents.length} total
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[var(--text-light)]">
                {filtered.length} shown
              </span>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-white/10 bg-[#2a2a2a] p-3 shadow-sm">
            <label className="mb-2 block px-2 text-xs font-medium uppercase tracking-wider text-[color:var(--text-muted-light)]">
              Search events
            </label>
            <input
              type="text"
              placeholder="Search by event name or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#343434] px-4 py-3 text-sm text-[var(--text-light)] shadow-sm outline-none transition placeholder:text-[color:var(--text-muted-light)] focus:border-[var(--text-hero)] focus:ring-2 focus:ring-[rgba(246,233,207,0.25)]"
            />
          </div>

          {initialError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {initialError}
            </div>
          )}

          {!initialError && filtered.length === 0 && (
            <div className="rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.58)] py-20 text-center shadow-sm backdrop-blur">
              <p className="text-sm text-[color:var(--text-muted-light)]">
                {search ? "No events match your search." : "No events available yet."}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-3 text-sm font-medium text-[var(--text-light)] hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {!initialError && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  href={`/attendee/events/${event.id}`}
                  tone="dark"
                  onClick={() => openEventModal(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.95)] p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={closeEventModal}
              className="absolute right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full text-base leading-none text-[color:var(--text-muted-light)] transition duration-200 hover:scale-110 hover:bg-white/10 hover:text-[var(--text-light)]"
            >
              ✕
            </button>

            {detailLoading ? (
              <div className="min-h-[640px] animate-pulse space-y-6">
                <div className="space-y-2">
                  <div className="h-8 w-2/5 rounded bg-white/10" />
                  <div className="h-4 w-1/3 rounded bg-white/10" />
                </div>
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
            ) : detailError || !selectedEvent ? (
              <div className="min-h-[220px] pt-8">
                <p className="text-sm text-red-300">{detailError ?? "Event not found"}</p>
              </div>
            ) : (
              <div className="relative min-h-[640px] overflow-hidden">
                <div
                  className={`flex h-full min-h-[640px] flex-col gap-6 transition-all duration-300 ease-out ${
                    isPurchasePanelOpen ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold text-[var(--text-hero)]">{selectedEvent.title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--text-muted-light)]">
                      Organised by {selectedEvent.organiser.name ?? "Unknown"}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-white/15 bg-[rgba(255,255,255,0.04)]">
                    {selectedEvent.imageUrl ? (
                      <Image
                        src={selectedEvent.imageUrl}
                        alt={selectedEvent.title}
                        width={1200}
                        height={500}
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center bg-[linear-gradient(135deg,rgba(246,233,207,0.2),rgba(255,255,255,0.06))]">
                        <p className="text-sm text-[color:var(--text-muted-light)]">No image uploaded</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">Date & Time</p>
                      <p className="text-[var(--text-light)]">{formatDate(selectedEvent.date)}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">Venue</p>
                      <p className="text-[var(--text-light)]">{selectedEvent.venue}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">Ticket Price</p>
                      <p className="text-[var(--text-hero)]">{formatPrice(selectedEvent.price)}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">Availability</p>
                      <p className="text-[var(--text-light)]">
                        {selectedEvent.availableSeats <= 0 ? "Sold out" : `${selectedEvent.availableSeats} seats left`}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">About this event</p>
                      <p className="text-sm text-[var(--text-light)]">{selectedEvent.description}</p>
                    </div>
                  )}

                  <div className="mt-auto pt-2">
                    <button
                      disabled={selectedEvent.availableSeats <= 0}
                      onClick={openPurchasePanel}
                      className={`w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
                        selectedEvent.availableSeats <= 0
                          ? "cursor-not-allowed bg-white/10 text-white/40"
                          : "btn-liquid border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] text-stone-900 hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)]"
                      }`}
                    >
                      {selectedEvent.availableSeats <= 0 ? (
                        "Sold Out"
                      ) : (
                        <span className="btn-liquid-label">{`Buy Ticket — ${formatPrice(selectedEvent.price)}`}</span>
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className={`absolute inset-0 transition-all duration-300 ease-out ${
                    isPurchasePanelOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="flex h-full min-h-[640px] flex-col gap-6">
                    <button
                      onClick={closePurchasePanel}
                      className="w-fit rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-[var(--text-light)] transition hover:bg-white/10"
                    >
                      ← Back to event
                    </button>
                    <h4 className="text-xl font-bold text-[var(--text-hero)]">Confirm Your Ticket</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[color:var(--text-muted-light)]">Event</span>
                        <span className="max-w-[60%] text-right font-medium text-[var(--text-light)]">{selectedEvent.title}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[color:var(--text-muted-light)]">Date</span>
                        <span className="text-[var(--text-light)]">{formatDate(selectedEvent.date)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[color:var(--text-muted-light)]">Venue</span>
                        <span className="text-[var(--text-light)]">{selectedEvent.venue}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[color:var(--text-muted-light)]">Organiser</span>
                        <span className="text-[var(--text-light)]">{selectedEvent.organiser.name ?? "Unknown"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[color:var(--text-muted-light)]">Seats left</span>
                        <span
                          className={
                            selectedEvent.availableSeats <= 10
                              ? "font-medium text-amber-300"
                              : "font-medium text-emerald-300"
                          }
                        >
                          {selectedEvent.availableSeats}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-white/10" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-light)]">Total</span>
                      <span className="text-2xl font-bold text-[var(--text-hero)]">{formatPrice(selectedEvent.price)}</span>
                    </div>

                    <div className="rounded-lg border border-blue-300/30 bg-blue-500/10 px-4 py-3 text-xs text-blue-200">
                      Payment is simulated — no real charge will be made.
                    </div>

                    {purchaseState === "error" && purchaseError && (
                      <div className="rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-2 text-xs text-red-200">
                        {purchaseError}
                      </div>
                    )}

                    <div className="mt-auto pt-2">
                      {purchaseState === "success" && purchasedTicketId ? (
                        <div className="space-y-3">
                          <p className="text-sm text-emerald-200">Your ticket has been confirmed.</p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <button
                              onClick={() => openPurchasedTicketModal(purchasedTicketId)}
                              className="btn-liquid rounded-xl border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)]"
                            >
                              <span className="btn-liquid-label">View My Ticket</span>
                            </button>
                            <button
                              onClick={() => router.push("/attendee/tickets")}
                              className="btn-liquid rounded-xl border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)]"
                            >
                              <span className="btn-liquid-label">All My Tickets</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handlePurchaseConfirm}
                          disabled={purchaseState === "loading"}
                          className="btn-liquid w-full rounded-xl border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="btn-liquid-label">
                            {purchaseState === "loading"
                              ? "Processing..."
                              : selectedEvent.price === 0
                                ? "Claim Free Ticket"
                                : `Confirm Purchase — ${formatPrice(selectedEvent.price)}`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {(ticketModalLoading || ticketModalError || selectedTicket) && (
        <TicketDetailModal
          ticket={selectedTicket}
          loading={ticketModalLoading}
          qrDataUrl={ticketQrDataUrl}
          error={ticketModalError}
          onClose={closeTicketModal}
        />
      )}
      <Footer tone="dark" />
    </main>
  );
}
