// GET /api/seats?eventId=  — fetch seat map for an event
// Completed in: Module 2 — Events
import { NextResponse } from "next/server"

export async function GET() {
  // TODO: Module 2
  return NextResponse.json({ success: true, data: [] })
}
