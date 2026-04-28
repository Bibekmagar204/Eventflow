"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "ATTENDEE",
  })
  const [error,   setError]   = useState("")
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res  = await fetch("/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    })
    const data = await res.json()

    if (!data.success) {
      setError(data.error ?? "Something went wrong")
      setLoading(false)
      return
    }

    // Account created — go to login
    router.push("/login?registered=true")
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
            Join EventFlow
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-hero)]">Create your account</h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted-light)]">Set up your profile and start exploring live events.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-light)]">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[var(--text-hero)] focus:ring-2 focus:ring-[rgba(246,233,207,0.35)]"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-light)]">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[var(--text-hero)] focus:ring-2 focus:ring-[rgba(246,233,207,0.35)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-light)]">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[var(--text-hero)] focus:ring-2 focus:ring-[rgba(246,233,207,0.35)]"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-light)]">I am A...</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[var(--text-hero)] focus:ring-2 focus:ring-[rgba(246,233,207,0.35)]"
            >
              <option value="ATTENDEE">Attendee — I want to buy tickets</option>
              <option value="ORGANISER">Organiser — I want to create events</option>
              <option value="STAFF">Staff — I will scan tickets</option>
            </select>
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
            <span className="btn-liquid-label">{loading ? "Creating account..." : "Create account"}</span>
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[color:var(--text-muted-light)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--text-light)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
