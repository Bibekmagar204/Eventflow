# Project Initialization & Scaffold

## Tool
Claude by Anthropic — claude.ai

## Date
May 2026

## Prompt

You are an expert full-stack web developer specializing in Next.js 14,
TypeScript, Prisma ORM, and PostgreSQL. I need you to scaffold a complete
multi-role event ticketing web application called EventFlow from scratch.

Project requirements:

The system must support three distinct user roles — Organiser, Attendee,
and Staff — each with their own protected dashboard and functionality.
Authentication must be handled by NextAuth.js using a credentials provider,
with passwords hashed using bcrypt and roles stored in the session and
database.

Tech stack — use exactly the following:
- Framework: Next.js 14 with the App Router (no Pages Router)
- Language: TypeScript throughout — no plain JavaScript files
- ORM: Prisma with a PostgreSQL database hosted on Supabase
- Styling: Tailwind CSS
- Payments: Stripe (PaymentIntents + Webhooks)
- Image storage: Supabase Storage
- Authentication: NextAuth.js credentials provider

Database models to scaffold:
- User — id, name, email, hashedPassword, role (enum: ORGANISER, ATTENDEE,
  STAFF), createdAt
- Event — id, title, description, date, venue, price, capacity, published,
  imageUrl, organiserId (FK → User)
- Seat — id, label, isAvailable, eventId (FK → Event)
- Order — id, total, status (enum: PENDING, COMPLETED, REFUNDED, CANCELLED,
  FAILED), paymentIntentId, userId (FK → User), eventId (FK → Event), createdAt
- Ticket — id, qrCode, checkedIn, orderId (FK → Order), eventId (FK → Event),
  seatId (FK → Seat), createdAt

Folder structure to generate:
- app/(auth)/login and app/(auth)/register — public auth pages
- app/(organiser)/dashboard — protected organiser layout and dashboard
- app/(attendee)/browse — protected attendee event browsing page
- app/(staff)/scanner — protected staff QR scanner page
- app/api/ — all REST route handlers
- lib/ — shared utilities: auth.ts, prisma.ts, stripe.ts, qr.ts
- prisma/schema.prisma — full Prisma schema with all models and relations

Route protection rules:
- Unauthenticated users are redirected to /login
- ORGANISER users can only access /organiser routes
- ATTENDEE users can only access /attendee routes
- STAFF users can only access /staff routes
- Implement this using Next.js middleware (middleware.ts) reading the
  NextAuth session

Do not:
- Use the Pages Router
- Use plain JavaScript — TypeScript only
- Use any UI component library (no shadcn, no MUI) — custom Tailwind CSS only
- Generate placeholder or lorem ipsum content
- Leave any TODO comments — write complete, working code

Start by generating: the full prisma/schema.prisma, the middleware.ts route
protection file, the NextAuth configuration at
app/api/auth/[...nextauth]/route.ts, and the base folder structure with empty
but correctly typed files. Do not proceed to feature implementation until the
scaffold is confirmed.

## Purpose
To initialize the EventFlow project with the correct folder structure, tech
stack, database schema, and route protection before any feature development
began.

## Output Summary
Claude generated the complete project scaffold including the Prisma schema
with all five models, the Next.js middleware for role-based route protection,
the NextAuth credentials configuration, and all base folder structure with
correctly typed empty files.