// Thin wrapper around next-auth useSession — adds type safety
"use client"

import { useSession as useNextSession } from "next-auth/react"
import { UserRole } from "@/types"

export function useSession() {
  const { data, status } = useNextSession()
  return {
    user: data?.user as { id: string; email: string; name: string; role: UserRole } | undefined,
    status,
    isLoading: status === "loading",
    isAuthed:  status === "authenticated",
  }
}
