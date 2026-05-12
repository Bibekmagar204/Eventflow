# Database Schema & Prisma Models

## Tool
Claude by Anthropic — claude.ai

## Date
May 2026

## Prompt

You are an expert full-stack developer working on an existing Next.js 14
TypeScript project called EventFlow. The project uses Prisma ORM with a
PostgreSQL database hosted on Supabase. The folder structure and NextAuth
authentication are already set up. Your task is to design and implement the
complete Prisma database schema.

Write the complete prisma/schema.prisma file with the following models and
exact specifications:

- User — id (cuid), name (String), email (String, unique), hashedPassword
  (String), role (enum Role), createdAt (DateTime, default now). Relations:
  one User has many Events (as organiser), many Orders, many Tickets.
- Event — id (cuid), title (String), description (String), date (DateTime),
  venue (String), price (Float), capacity (Int), published (Boolean, default
  false), imageUrl (String, optional), organiserId (FK → User), createdAt
  (DateTime). Relations: one Event has many Seats, many Tickets, many Orders.
- Seat — id (cuid), label (String), isAvailable (Boolean, default true),
  eventId (FK → Event). Relations: one Seat has zero or one Ticket.
- Order — id (cuid), total (Float), status (enum OrderStatus),
  paymentIntentId (String, unique), userId (FK → User), eventId (FK → Event),
  createdAt (DateTime). Relations: one Order has many Tickets.
- Ticket — id (cuid), qrCode (String, unique), checkedIn (Boolean, default
  false), orderId (FK → Order), eventId (FK → Event), seatId (FK → Seat,
  unique), createdAt (DateTime).

Enumerations:
- Role: ORGANISER, ATTENDEE, STAFF
- OrderStatus: PENDING, COMPLETED, REFUNDED, CANCELLED, FAILED

Requirements:
- Use provider = "postgresql" and shadowDatabaseUrl for Supabase compatibility
- All IDs use @default(cuid())
- All cascade delete rules must be explicitly defined — deleting an Event
  cascades to its Seats and Tickets
- All relation fields must be explicitly named to avoid Prisma ambiguity errors
- After writing the schema, generate the initial migration command and the
  Prisma client generation command
- Do not add any models, fields, or relations beyond what is specified above
- Do not use @map or @@map unless required for Supabase compatibility

## Purpose
To define the complete relational database schema for EventFlow covering all
five core models and their relationships.

## Output Summary
Claude generated the complete prisma/schema.prisma file with all five models,
two enumerations, explicit cascade delete rules, and the correct Supabase
PostgreSQL provider configuration along with the migration and client
generation commands.