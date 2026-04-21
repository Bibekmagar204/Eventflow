// Fetch current user's tickets — completed in Module 3: Ticketing
"use client"

import { useEffect, useState } from "react"
import { TicketWithDetails } from "@/types"

export function useTickets() {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((d) => setTickets(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return { tickets, loading }
}
