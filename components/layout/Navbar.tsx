"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"

interface NavbarProps {
  ctaHref?: string
  ctaLabel?: string
  variant?: "transparent" | "solid"
}

export default function Navbar({
  ctaHref = "/login",
  ctaLabel = "Sign in",
  variant = "solid",
}: NavbarProps) {
  const { data: session } = useSession()
  const transparent = variant === "transparent"
  const isAttendee = session?.user?.role === "ATTENDEE"
  const isOrganiser = session?.user?.role === "ORGANISER"
  const displayName = session?.user?.name?.trim()
  const userInitial = displayName?.charAt(0).toUpperCase()

  return (
    <nav className={`${transparent ? "absolute inset-x-0 top-0 z-30" : "sticky top-0 z-30"}`}>
      <div
        className={`mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 ${
          transparent
            ? "rounded-2xl border border-white/15 bg-black/35 shadow-2xl shadow-black/35 backdrop-blur-xl"
            : "border-b border-gray-200/80 bg-white/95 backdrop-blur"
        }`}
      >
        <Link
          href="/"
          className={`flex items-center gap-2 text-lg font-bold tracking-tight ${
            transparent ? "text-[var(--text-light)]" : "text-gray-900"
          }`}
        >
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${
              transparent ? "bg-white/10 ring-white/20" : "bg-indigo-50 ring-indigo-100"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${transparent ? "bg-indigo-300" : "bg-indigo-600"}`}
            />
          </span>
          EventFlow
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAttendee && (
            <>
              <Link
                href="/attendee/events"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  transparent
                    ? "text-[color:var(--text-muted-light)] hover:bg-white/10 hover:text-[var(--text-light)]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                Browse Events
              </Link>
              <Link
                href="/attendee/tickets"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  transparent
                    ? "text-[color:var(--text-muted-light)] hover:bg-white/10 hover:text-[var(--text-light)]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                My Tickets
              </Link>
            </>
          )}
          {isOrganiser && (
            <Link
              href="/organiser/dashboard"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                transparent
                  ? "text-[color:var(--text-muted-light)] hover:bg-white/10 hover:text-[var(--text-light)]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              Dashboard
            </Link>
          )}
          {session?.user ? (
            <>
              <div className="inline-flex items-center gap-2">
                {userInitial && (
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold leading-none ${
                      transparent
                        ? "border-white/25 bg-white/10 text-[var(--text-light)]"
                        : "border-gray-200 bg-white text-gray-800"
                    }`}
                    aria-label="Profile initial"
                    title={displayName}
                  >
                    {userInitial}
                  </span>
                )}
                {displayName && (
                  <span
                    className={`text-sm font-semibold ${
                      transparent ? "text-[var(--text-light)]" : "text-gray-800"
                    }`}
                  >
                    {displayName}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className={`btn-liquid inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  transparent
                    ? "border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] text-stone-900 hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)]"
                    : "border-indigo-500 bg-indigo-600 text-white hover:border-indigo-400 hover:bg-indigo-500"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m16 17 5-5-5-5" />
                  <path d="M21 12H9" />
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                </svg>
                <span className="btn-liquid-label">Log out</span>
              </button>
            </>
          ) : (
            <Link
              href={ctaHref}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                transparent
                  ? "btn-liquid border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] text-gray-900 hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)]"
                  : "border-indigo-500 bg-indigo-600 text-white hover:border-indigo-400 hover:bg-indigo-500"
              }`}
            >
              <span className={transparent ? "btn-liquid-label" : ""}>{ctaLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
