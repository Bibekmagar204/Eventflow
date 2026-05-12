// Singleton Prisma client — prevents connection pool exhaustion in dev
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

/** Supabase transaction pooler (port 6543) requires `pgbouncer=true` so Prisma skips prepared statements. */
function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw) return undefined
  try {
    const u = new URL(raw)
    if (u.port === "6543" && !u.searchParams.has("pgbouncer")) {
      u.searchParams.set("pgbouncer", "true")
    }
    return u.toString()
  } catch {
    return raw
  }
}

const dbUrl = resolveDatabaseUrl()

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
