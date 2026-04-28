// lib/validations.ts
// Zod schemas for API request validation
import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["ORGANISER", "ATTENDEE", "STAFF"]).default("ATTENDEE"),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().min(1),           // relaxed — accepts datetime-local format
  venue: z.string().min(1),
  capacity: z.number().int().positive(),
  price: z.number().nonnegative(),   // added — price in dollars (e.g. 25.00)
  imageUrl: z.string().url().optional(),
})

export const purchaseSchema = z.object({
  eventId: z.string(),
  seatIds: z.array(z.string()).optional(),
  quantity: z.number().int().positive().optional(),
})

export const validateTicketSchema = z.object({
  qrCode: z.string(),
  eventId: z.string(),
})