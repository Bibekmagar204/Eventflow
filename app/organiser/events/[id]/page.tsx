// app/organiser/events/[id]/page.tsx
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
  createdAt: string;
  availableSeats: number;
  organiser: { name: string | null; email: string };
  _count: { seats: number; tickets: number };
}

export default function OrganiserEventDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
    price: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load event");
        setEvent(json.data);
        // Pre-fill edit form
        setForm({
          title: json.data.title,
          description: json.data.description ?? "",
          date: new Date(json.data.date).toISOString().slice(0, 16),
          venue: json.data.venue,
          price: String(json.data.price),
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  async function togglePublish() {
    if (!event) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !event.published }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEvent((prev) =>
        prev ? { ...prev, published: !prev.published } : prev
      );
    } catch {
      alert("Could not update. Please try again.");
    } finally {
      setToggling(false);
    }
  }

  async function handleSave() {
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          date: new Date(form.date).toISOString(),
          venue: form.venue,
          price: parseFloat(form.price),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      // Merge updated fields back into event state
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              title: json.data.title,
              description: json.data.description,
              date: json.data.date,
              venue: json.data.venue,
              price: json.data.price,
            }
          : prev
      );
      setEditing(false);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

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
            onClick={() => router.push("/organiser/dashboard")}
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const soldCount = event._count.tickets;
  const soldPercent = Math.round((soldCount / event.capacity) * 100);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back link */}
        <button
          onClick={() => router.push("/organiser/dashboard")}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back to dashboard
        </button>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {event.title}
                </h1>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    event.published
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {event.published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Created {formatDate(event.createdAt)}
              </p>
            </div>

            {/* Publish toggle */}
            <button
              onClick={togglePublish}
              disabled={toggling}
              className={`shrink-0 text-sm font-medium px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                event.published
                  ? "border-gray-300 text-gray-600 hover:bg-gray-50"
                  : "border-blue-400 text-blue-600 hover:bg-blue-50"
              }`}
            >
              {toggling
                ? "Saving..."
                : event.published
                ? "Unpublish"
                : "Publish"}
            </button>
          </div>

          {/* Event details — view mode */}
          {!editing && (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-4">
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
                  <p>{formatPrice(event.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Capacity
                  </p>
                  <p>{event.capacity} seats</p>
                </div>
              </div>

              {event.description && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-gray-600">{event.description}</p>
                </div>
              )}

              <button
                onClick={() => setEditing(true)}
                className="mt-2 text-blue-600 text-sm font-medium hover:underline"
              >
                Edit details →
              </button>
            </div>
          )}

          {/* Edit mode */}
          {editing && (
            <div className="space-y-4">
              {saveError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, date: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, venue: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Ticket Price ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sales stats card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Ticket Sales
          </h2>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{soldCount} sold</span>
              <span>{event.availableSeats} remaining</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all"
                style={{ width: `${soldPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {soldPercent}% of {event.capacity} capacity sold
            </p>
          </div>

          {/* Revenue */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Estimated Revenue
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(soldCount * event.price)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}