// Fetch events from the API — completed in Module 2: Events
"use client"

import { useEffect, useState } from "react"
import { EventSummary } from "@/types"

export function useEvents() {
  const [events, setEvents]   = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.data ?? []))
      .catch(() => setError("Failed to load events"))
      .finally(() => setLoading(false))
  }, [])

  return { events, loading, error }
}
