// POST /api/tickets   — purchase tickets (Attendee only)
// GET  /api/tickets   — list my tickets
// Completed in: Module 3 — Ticketing
import { NextResponse } from "next/server"

export async function GET() {
  // TODO: Module 3
  return NextResponse.json({ success: true, data: [] })
}

export async function POST() {
  // TODO: Module 3
  return NextResponse.json({ success: false, error: "Not implemented" }, { status: 501 })
}
