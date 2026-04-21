// Displays a single ticket with QR code — Module 3
import { TicketWithDetails } from "@/types"
import { formatDate } from "@/lib/utils"

export default function TicketCard({ ticket }: { ticket: TicketWithDetails }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <h2 className="font-semibold">{ticket.event.title}</h2>
      <p className="text-sm text-gray-500">{formatDate(ticket.event.date)}</p>
      <p className="text-sm text-gray-500">{ticket.event.venue}</p>
      {/* TODO: Module 3 — QR code image + check-in status badge */}
    </div>
  )
}
