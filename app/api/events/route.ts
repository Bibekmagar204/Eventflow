// GET /api/events     — list published events
// POST /api/events    — create event (Organiser only)
// Completed in: Module 2 — Events
import { NextResponse } from "next/server"

export async function GET() {
  // TODO: Module 2
  return NextResponse.json({ success: true, data: [] })
}

export async function POST() {
  // TODO: Module 2
  return NextResponse.json({ success: false, error: "Not implemented" }, { status: 501 })
}
