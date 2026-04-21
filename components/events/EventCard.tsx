// Displays a single event in the browse grid — Module 2
import { EventSummary } from "@/types"
import { formatDate } from "@/lib/utils"

export default function EventCard({ event }: { event: EventSummary }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-lg font-semibold">{event.title}</h2>
      <p className="mt-1 text-sm text-gray-500">{formatDate(event.date)}</p>
      <p className="text-sm text-gray-500">{event.venue}</p>
      {/* TODO: Module 2 — ticket tier pricing, Buy button */}
    </div>
  )
}
