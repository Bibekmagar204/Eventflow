"use client"

import Image from "next/image"
import Link from "next/link"
import { formatDate, formatPrice } from "@/lib/utils"

export interface EventCardData {
  id: string
  title: string
  description?: string | null
  imageUrl?: string | null
  date: string | Date
  venue: string
  capacity: number
  price: number
  organiser?: { name: string | null }
  _count?: { tickets?: number }
}

interface EventCardProps {
  event: EventCardData
  href: string
  imageUrl?: string
  tone?: "dark" | "light"
  onClick?: () => void
}

export default function EventCard({ event, href, imageUrl, tone = "light", onClick }: EventCardProps) {
  const soldCount = event._count?.tickets ?? 0
  const soldOut = soldCount >= event.capacity
  const seatsLeft = Math.max(event.capacity - soldCount, 0)
  const image = imageUrl ?? event.imageUrl

  const dark = tone === "dark"

  return (
    <Link
      href={href}
      onClick={(linkEvent) => {
        if (!onClick) return
        linkEvent.preventDefault()
        onClick()
      }}
      className={`group relative block overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ${
        dark
          ? "border-white/20 bg-[rgba(20,18,28,0.58)] backdrop-blur hover:border-white/30 hover:bg-[rgba(20,18,28,0.64)]"
          : "border-stone-300/90 bg-white/85 backdrop-blur hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl"
      } ${soldOut ? "opacity-80" : "hover:-translate-y-1"}`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={event.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-300/30 blur-2xl" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          {soldOut ? (
            <span className="rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Sold out
            </span>
          ) : seatsLeft <= 10 ? (
            <span className="rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Almost full
            </span>
          ) : (
            <span
              suppressHydrationWarning
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${
                dark
                  ? "bg-[var(--text-hero)] text-stone-900"
                  : "bg-white/90 text-gray-900"
              }`}
            >
              {formatDate(event.date).split(",")[0]}
            </span>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h2
            className={`line-clamp-2 text-lg font-semibold drop-shadow-sm ${
              dark ? "text-[var(--text-hero)]" : "text-white"
            }`}
          >
            {event.title}
          </h2>
        </div>
      </div>

      <div className={`p-5 ${dark ? "text-[var(--text-light)]" : "text-gray-700"}`}>
        {event.description && (
          <p className={`mb-4 line-clamp-2 text-sm ${dark ? "text-[color:var(--text-muted-light)]" : "text-gray-500"}`}>
            {event.description}
          </p>
        )}

        <div className={`mb-4 space-y-1 text-sm ${dark ? "text-[color:var(--text-muted-light)]" : "text-gray-600"}`}>
          <p suppressHydrationWarning>{formatDate(event.date)}</p>
          <p>{event.venue}</p>
          {event.organiser?.name && <p>By {event.organiser.name}</p>}
        </div>

        <div
          className={`flex items-center justify-between border-t pt-4 ${
            dark ? "border-white/15" : "border-stone-200"
          }`}
        >
          <span className={`text-base font-bold ${dark ? "text-[var(--text-hero)]" : "text-gray-900"}`}>
            {formatPrice(event.price)}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              soldOut
                ? dark
                  ? "bg-red-500/20 text-[var(--text-light)]"
                  : "bg-red-100 text-red-600"
                : seatsLeft <= 10
                ? dark
                  ? "bg-amber-500/20 text-[var(--text-light)]"
                  : "bg-amber-100 text-amber-700"
                : dark
                ? "bg-emerald-500/20 text-[var(--text-light)]"
                : "bg-green-100 text-green-700"
            }`}
          >
            {soldOut ? "Sold out" : `${seatsLeft} left`}
          </span>
        </div>
      </div>
    </Link>
  )
}
