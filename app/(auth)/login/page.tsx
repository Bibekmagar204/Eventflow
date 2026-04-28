"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
      return
    }

    // Fetch session to get role and redirect
    const res  = await fetch("/api/auth/session")
    const data = await res.json()
    const role = data?.user?.role

    if (role === "ORGANISER") router.push("/organiser/dashboard")
    else if (role === "STAFF") router.push("/staff/scan")
    else router.push("/attendee/events")
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-100 px-4 py-10">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/login-hero-v2.png"
          alt="Concert crowd background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[rgba(20,18,28,0.45)]" />
      </div>

      <Link
        href="/"
        className="btn-liquid absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)] sm:left-6 sm:top-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200"
          aria-hidden="true"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        <span className="btn-liquid-label">Back to home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-[rgba(20,18,28,0.62)] p-8 shadow-xl backdrop-blur-md sm:p-9">
        <div className="mb-7 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted-light)]">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Welcome back
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-hero)]">Sign in to EventFlow</h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted-light)]">
            Access your dashboard, tickets, and upcoming events.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-light)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[var(--text-hero)] focus:ring-2 focus:ring-[rgba(246,233,207,0.35)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-light)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[var(--text-hero)] focus:ring-2 focus:ring-[rgba(246,233,207,0.35)]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-liquid mt-1 w-full rounded-xl border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)] disabled:opacity-50"
          >
            <span className="btn-liquid-label">{loading ? "Signing in..." : "Sign in"}</span>
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[color:var(--text-muted-light)]">
          No account?{" "}
          <Link href="/register" className="font-semibold text-[var(--text-light)] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  )
}
