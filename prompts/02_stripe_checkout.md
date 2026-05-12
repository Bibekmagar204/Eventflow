# Stripe Checkout & Webhook

## Tool
Claude by Anthropic — claude.ai

## Date
May 2026

## Prompt

You are an expert full-stack developer working on EventFlow, an existing
Next.js 14 TypeScript project. Prisma, PostgreSQL, and NextAuth are already
configured. The Order and Ticket models exist in the schema. Your task is to
implement the complete Stripe payment flow.

Implement the following exactly:

File 1 — app/api/checkout/intent/route.ts
A POST route handler that:
- Reads eventId and seatId from the request body
- Verifies the user is authenticated via NextAuth session — return 401 if not
- Checks the seat exists and isAvailable === true — return 400 if not
- Creates a Stripe PaymentIntent with the event price in cents, currency USD,
  and metadata containing userId, eventId, seatId
- Creates an Order in the database with status PENDING and the PaymentIntent ID
- Returns the clientSecret to the frontend

File 2 — app/api/checkout/webhook/route.ts
A POST route handler that:
- Verifies the Stripe webhook signature using STRIPE_WEBHOOK_SECRET — return
  400 if invalid
- Handles payment_intent.succeeded: inside a single prisma.$transaction, set
  Order status to COMPLETED, create a Ticket with a unique qrCode (use
  crypto.randomUUID()), set seat.isAvailable = false
- Handles payment_intent.payment_failed and payment_intent.canceled: set Order
  status to FAILED or CANCELLED respectively
- Returns 200 for all handled events, 400 for unrecognized events

File 3 — lib/stripe.ts
Initialize and export a single Stripe instance using STRIPE_SECRET_KEY from
environment variables.

Requirements:
- Use export const runtime = "edge" on the webhook route for raw body access
- Never log or expose the PaymentIntent secret
- All database operations inside webhook handlers must be wrapped in try/catch
  with proper error responses
- Do not implement any frontend code — backend route handlers only
- Do not use deprecated Stripe APIs — use the latest Stripe Node.js SDK syntax

## Purpose
To implement the complete Stripe payment intent creation and webhook
fulfillment flow for ticket purchases.

## Output Summary
Claude generated the /api/checkout/intent and /api/checkout/webhook route
handlers including the Prisma transaction that creates the ticket, updates
the order status, and reserves the seat atomically on payment success.