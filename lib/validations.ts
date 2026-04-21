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
  date: z.string().datetime(),
  venue: z.string().min(1),
  isSeated: z.boolean().default(false),
  capacity: z.number().int().positive(),
})

export const purchaseSchema = z.object({
  eventId: z.string(),
  seatIds: z.array(z.string()).optional(), // for seated events
  quantity: z.number().int().positive().optional(), // for GA events
})

export const validateTicketSchema = z.object({
  qrCode: z.string(),
  eventId: z.string(),
})
