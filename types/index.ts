// Shared TypeScript types across the app

export type UserRole = "ORGANISER" | "ATTENDEE" | "STAFF"
export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED"

export interface SafeUser {
  id: string
  email: string
  name: string | null
  role: UserRole
}

export interface EventSummary {
  id: string
  title: string
  description: string | null
  date: string
  venue: string
  isSeated: boolean
  capacity: number
  published: boolean
  organiserId: string
}

export interface SeatInfo {
  id: string
  row: string
  number: number
  tier: string
  price: number
  reserved: boolean
}

export interface TicketWithDetails {
  id: string
  qrCode: string
  checkedIn: boolean
  usedAt: string | null
  event: {
    title: string
    date: string
    venue: string
  }
  seat: SeatInfo | null
}

export interface ApiResponse<T = null> {
  success: boolean
  data?: T
  error?: string
}
