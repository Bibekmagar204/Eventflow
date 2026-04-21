// Shared navbar — role-aware, completed in Module 1: Auth
// Shows different links depending on session role
"use client"

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-4">
      <span className="text-lg font-bold tracking-tight">EventFlow</span>
      {/* TODO: Module 1 — session-aware nav links + logout */}
    </nav>
  )
}
