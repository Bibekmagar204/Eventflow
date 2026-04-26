// app/organiser/events/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
    capacity: "",
    price: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          date: new Date(form.date).toISOString(),
          venue: form.venue,
          capacity: parseInt(form.capacity, 10),
          price: parseFloat(form.price),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const firstError =
          typeof json.error === "string"
            ? json.error
            : Object.values(json.error as Record<string, string[]>)
                .flat()
                .join(", ");
        setError(firstError);
        return;
      }

      // Redirect to dashboard after successful creation
      router.push("/organiser/dashboard");
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the details below. You can publish the event from your
            dashboard.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g. Spring Music Festival"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Tell attendees what to expect..."
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              name="date"
              type="datetime-local"
              required
              value={form.date}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue <span className="text-red-500">*</span>
            </label>
            <input
              name="venue"
              type="text"
              required
              placeholder="e.g. Austin Convention Center"
              value={form.venue}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Capacity + Price side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity <span className="text-red-500">*</span>
              </label>
              <input
                name="capacity"
                type="number"
                required
                min={1}
                placeholder="100"
                value={form.capacity}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                name="price"
                type="number"
                required
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}