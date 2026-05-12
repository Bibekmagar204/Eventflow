# Organiser Dashboard & Refunds

## Tool
Claude by Anthropic — claude.ai

## Date
May 2026

## Prompt

You are an expert full-stack developer working on EventFlow, an existing
Next.js 14 TypeScript project. Authentication, Prisma, Stripe, and all
database models are already implemented. Your task is to build the complete
organiser dashboard including event management, order tracking, and refund
functionality.

Implement the following exactly:

File 1 — app/(organiser)/dashboard/page.tsx
A server component that:
- Verifies the user is authenticated with role ORGANISER — redirect to
  /login if not
- Queries all Events belonging to the organiser with aggregated stats:
  tickets sold, total revenue, capacity
- Displays four stat cards at the top: Total Revenue, Tickets Sold, Total
  Events, Published Events
- Below stats, renders a list of the organiser's events each showing: title,
  date, venue, published badge (Published/Draft), tickets sold progress bar,
  revenue, and four action buttons: Publish/Unpublish, Orders, View/Edit,
  Delete

File 2 — app/api/events/[id]/publish/route.ts
A PATCH route handler that toggles published on an Event. Verifies the
requesting user owns the event — return 403 if not. Returns the updated
event.

File 3 — app/api/events/route.ts
- GET: returns all published events with their seat availability count for
  the attendee browse page
- POST: creates a new Event for the authenticated organiser. Validates all
  required fields. After creating the event, automatically generates Seat
  records labeled "GA-1" through "GA-N" where N is the event capacity, all
  with isAvailable: true

File 4 — app/api/orders/[id]/refund/route.ts
A PATCH route handler that:
- Verifies the requesting user is authenticated with role ORGANISER and owns
  the event the order belongs to — return 403 if not
- Checks the order status is COMPLETED — return 400 if already refunded or
  not completed
- Inside a single prisma.$transaction: issue a Stripe refund using the
  order's paymentIntentId, set Order status to REFUNDED, set all associated
  Tickets checkedIn = false and qrCode = "" to invalidate them, set the
  associated Seat isAvailable = true to restore availability
- If the Stripe refund fails, abort the transaction and return 502 with the
  Stripe error message
- Return 200 with the updated order on success

Requirements:
- All financial figures must be displayed in USD formatted with two decimal
  places
- The delete event button must show a confirmation dialog before calling
  DELETE /api/events/[id]
- Deleting an event must only be allowed if it has zero completed orders —
  return 400 with an explanation if not
- Revenue calculations must be done server-side using Prisma aggregation —
  never calculate totals on the client
- Do not expose other organisers' events or orders at any point — always
  filter by the authenticated user's organiserId

## Purpose
To build the organiser dashboard with full event management, order tracking,
revenue analytics, and Stripe refund functionality.

## Output Summary
Claude generated the organiser dashboard server component with aggregated
stats, the event list with publish controls, the events API route with
automatic seat generation, and the refund route handler that atomically
updates the order, invalidates the ticket, and restores seat availability
inside a single Prisma transaction.