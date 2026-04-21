// Protects pages by role — completed in Module 1: Auth
// Usage: wrap a page with <RoleGuard role="ORGANISER">
"use client"

import { UserRole } from "@/types"
import { ReactNode } from "react"

interface Props {
  role: UserRole
  children: ReactNode
}

export default function RoleGuard({ children }: Props) {
  // TODO: Module 1 — check session role and redirect if unauthorised
  return <>{children}</>
}
