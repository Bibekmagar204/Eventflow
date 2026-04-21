"use client"

import { useSession, signOut } from "next-auth/react"

export default function StaffScan() {
  const { data: session } = useSession()

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between border-b bg-white px-6 py-4">
        <span className="text-lg font-bold">EventFlow</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {session?.user?.name} · Staff
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </nav>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Ticket Scanner</h1>
        <p className="mt-2 text-gray-500">QR scanner coming in the Validation module.</p>
      </div>
    </main>
  )
}
