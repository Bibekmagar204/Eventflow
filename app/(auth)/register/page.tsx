"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Create account</h1>
        <p className="mb-6 text-sm text-gray-500">Join EventFlow today</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">I am a...</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ATTENDEE">Attendee — I want to buy tickets</option>
              <option value="ORGANISER">Organiser — I want to create events</option>
              <option value="STAFF">Staff — I will scan tickets</option>
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
