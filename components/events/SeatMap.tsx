// Interactive seat map — Module 2 + 3
// Renders a grid of seats, colour-coded by availability
"use client"

import { SeatInfo } from "@/types"

interface Props {
  seats: SeatInfo[]
  onSelect?: (seat: SeatInfo) => void
  selected?: string[]
}

export default function SeatMap({ seats, onSelect, selected = [] }: Props) {
  // TODO: Module 2 — group seats by row, render grid
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-gray-400">Seat map — {seats.length} seats total</p>
    </div>
  )
}
