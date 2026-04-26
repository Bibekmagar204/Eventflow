// lib/utils.ts
// Shared utility functions
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a date for display
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

// Format currency — price is stored as dollars (e.g. 25.00), not cents
export function formatPrice(price: number): string {
  if (price === 0) return "Free"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}