# QR Code Generation & Ticket Display

## Tool
Claude by Anthropic — claude.ai

## Date
May 2026

## Prompt

You are an expert full-stack developer working on EventFlow, an existing
Next.js 14 TypeScript project. Stripe checkout is already implemented and
creates a Ticket record in the database with a qrCode field containing a UUID
string after payment succeeds. Your task is to build the complete ticket
display page for the attendee.

Implement the following exactly:

File 1 — app/(attendee)/tickets/page.tsx
A server component that:
- Gets the current user session via NextAuth — redirect to /login if
  unauthenticated
- Queries all Tickets belonging to the current user joined with their Event
  and Seat data
- Renders a list of ticket cards, each showing: event title, date, venue,
  seat label, amount paid, order ID
- Each card has a "View QR Code" button that links to /tickets/[ticketId]

File 2 — app/(attendee)/tickets/[ticketId]/page.tsx
A page that:
- Fetches the ticket by ID and verifies it belongs to the currently
  authenticated user — return 404 if not found or unauthorized
- Passes the ticket.qrCode string as a prop to a client component for
  rendering
- Displays event name, date, venue, seat label, amount paid, and order
  reference number
- Shows a "VALID" green badge if checkedIn === false, or a "USED" red badge
  if checkedIn === true

File 3 — components/QRDisplay.tsx
A client component ("use client") that:
- Accepts qrCode: string as a prop
- Uses the qrcode npm package to generate a QR code data URL from the qrCode
  string
- Renders the QR code as an <img> tag with alt text "Scan at the door"
- Shows a loading state while the QR code is generating
- Handles and displays errors if QR generation fails

Requirements:
- Install qrcode and @types/qrcode — include the exact install command
- QR code must be generated client-side, never on the server
- The QR code image must be at least 256x256 pixels
- Do not use any third-party QR rendering React libraries — use the qrcode
  package directly
- Do not expose any other user's ticket data — always filter by the
  authenticated user's ID

## Purpose
To build the attendee-facing ticket page that displays a scannable QR code
after a successful Stripe purchase.

## Output Summary
Claude generated the tickets list page, the individual ticket detail page,
and the QRDisplay client component that generates and renders the QR code
client-side using the qrcode npm package.