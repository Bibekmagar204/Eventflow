import { config as loadEnv } from "dotenv"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import fs from "fs"
import path from "path"

loadEnv({ path: ".env.test" })
loadEnv({ path: ".env.local" })
loadEnv()

/** Prefer DIRECT_URL so seeding works with poolers (e.g. Supabase) that reject prepared statements. */
const prismaUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const prisma = new PrismaClient({
  datasources: prismaUrl ? { db: { url: prismaUrl } } : undefined,
})

export const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? "TestPassword12345!"

const ORG_EMAIL = process.env.E2E_ORGANISER_EMAIL ?? "e2e-organiser@eventflow.test"
const ATT_EMAIL = process.env.E2E_ATTENDEE_EMAIL ?? "e2e-attendee@eventflow.test"
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL ?? "e2e-staff@eventflow.test"

export const E2E_EVENT_TITLE = process.env.E2E_EVENT_TITLE ?? "E2E Acceptance Event"

async function upsertUser(
  email: string,
  name: string,
  role: "ORGANISER" | "ATTENDEE" | "STAFF"
) {
  const hashed = await bcrypt.hash(E2E_PASSWORD, 12)
  return prisma.user.upsert({
    where: { email },
    create: { email, name, role, password: hashed },
    update: { name, role, password: hashed },
  })
}

export default async function globalSetup() {
  if (process.env.E2E_SKIP_GLOBAL_SETUP === "1") {
    console.log("[e2e] Skipping global setup (E2E_SKIP_GLOBAL_SETUP=1)")
    return
  }

  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    console.warn(
      "[e2e] DATABASE_URL / DIRECT_URL is not set; skipping DB seed. Set DATABASE_URL or E2E_SKIP_GLOBAL_SETUP=1."
    )
    return
  }

  const organiser = await upsertUser(ORG_EMAIL, "E2E Organiser", "ORGANISER")
  await upsertUser(ATT_EMAIL, "E2E Attendee", "ATTENDEE")
  await upsertUser(STAFF_EMAIL, "E2E Staff", "STAFF")

  const existing = await prisma.event.findFirst({
    where: { title: E2E_EVENT_TITLE, organiserId: organiser.id },
  })

  const future = new Date()
  future.setDate(future.getDate() + 30)

  if (!existing) {
    await prisma.$transaction(async (tx) => {
      const capacity = 8
      const ev = await tx.event.create({
        data: {
          title: E2E_EVENT_TITLE,
          description: "Seeded for Playwright acceptance tests (free ticket).",
          date: future,
          venue: "E2E Venue",
          capacity,
          price: 0,
          published: true,
          organiserId: organiser.id,
        },
      })
      const seats = Array.from({ length: capacity }, (_, i) => ({
        eventId: ev.id,
        label: `GA-${i + 1}`,
        isAvailable: true,
      }))
      await tx.seat.createMany({ data: seats })
    })
    console.log(`[e2e] Seeded published free event: "${E2E_EVENT_TITLE}"`)
  } else {
    await prisma.event.update({
      where: { id: existing.id },
      data: {
        published: true,
        price: 0,
        date: future,
      },
    })
    console.log(`[e2e] Normalised existing event: "${E2E_EVENT_TITLE}"`)
  }

  const outDir = path.join(process.cwd(), "test-results", "acceptance", "_meta")
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(
    path.join(outDir, "seed.json"),
    JSON.stringify(
      {
        organiserEmail: ORG_EMAIL,
        attendeeEmail: ATT_EMAIL,
        staffEmail: STAFF_EMAIL,
        eventTitle: E2E_EVENT_TITLE,
      },
      null,
      2
    ),
    "utf8"
  )

  await prisma.$disconnect()
}
