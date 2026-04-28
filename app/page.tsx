import Image from "next/image"
import { getServerSession } from "next-auth"
import Footer from "@/components/layout/Footer"
import HomeEventsMarquee, { HomeEventDetail } from "@/components/home/HomeEventsMarquee"
import Navbar from "@/components/layout/Navbar"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getUpcomingEvents(): Promise<{
  events: HomeEventDetail[]
  prefetchedEventDetails: Record<string, HomeEventDetail>
}> {
  const events = await prisma.event.findMany({
    where: {
      published: true,
      date: { gte: new Date() },
    },
    include: {
      organiser: { select: { name: true } },
      _count: { select: { tickets: true } },
    },
    orderBy: { date: "asc" },
    take: 6,
  })

  const mapped = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    imageUrl: (event as any).imageUrl ?? null,
    date: event.date.toISOString(),
    venue: event.venue,
    capacity: event.capacity,
    price: event.price,
    published: event.published,
    availableSeats: Math.max(event.capacity - (event._count?.tickets ?? 0), 0),
    organiser: { name: event.organiser?.name ?? null },
    _count: { seats: event.capacity, tickets: event._count?.tickets ?? 0 },
  }))

  return {
    events: mapped,
    prefetchedEventDetails: Object.fromEntries(mapped.map((event) => [event.id, event])),
  }
}

const FEATURE_CARDS = [
  {
    title: "Discover",
    body: "Browse curated upcoming events without ever creating an account.",
  },
  {
    title: "Reserve",
    body: "Sign in to lock in your seat with secure, instant checkout.",
  },
  {
    title: "Experience",
    body: "Get a digital ticket with QR check-in waiting in your inbox.",
  },
]

export default async function Home() {
  const session = await getServerSession(authOptions)
  const { events, prefetchedEventDetails } = await getUpcomingEvents()

  return (
    <main className="min-h-screen bg-stone-100 text-slate-900">
      <div className="relative">
        <Navbar variant="transparent" />

        <section className="relative isolate min-h-screen overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src="/images/hero.jpg"
              alt="Concert crowd"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[rgba(20,18,28,0.35)]" />
          </div>

          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-10 px-4 pb-20 pt-28 text-center sm:px-6 md:pb-24 md:pt-36">
            <h1
              className="animate-fade-up max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-[var(--text-hero)] drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)] sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ ["--reveal-delay" as string]: "120ms" }}
            >
              Find the night everyone talks about.
            </h1>

            <div className="animate-fade-up relative w-screen max-w-none overflow-hidden" style={{ ["--reveal-delay" as string]: "360ms" }}>
              <div className="absolute inset-y-0 left-0 z-20 w-[15vw] bg-gradient-to-r from-black/80 to-transparent" />
              <div className="absolute inset-y-0 right-0 z-20 w-[15vw] bg-gradient-to-l from-black/80 to-transparent" />
              {events.length === 0 ? (
                <HomeEventsMarquee
                  events={events}
                  prefetchedEventDetails={prefetchedEventDetails}
                  viewerRole={session?.user?.role}
                />
              ) : (
                <HomeEventsMarquee
                  events={events}
                  prefetchedEventDetails={prefetchedEventDetails}
                  viewerRole={session?.user?.role}
                />
              )}
            </div>

          </div>
        </section>

        <section
          id="upcoming-events"
          className="relative overflow-hidden bg-gradient-to-br from-[var(--text-hero)] via-[#efe2c8] to-[#e4d5b7] py-20"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-12 top-10 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-400/40 bg-white/55 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-stone-700">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
              Our mission
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 md:text-5xl">
                Bring people together through unforgettable live experiences.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-stone-700 md:text-base">
                EventFlow exists to make discovering, organizing, and attending events seamless for
                everyone. We give communities and creators a modern platform to turn ideas into sold-out
                moments, while helping attendees find their next favorite night out.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 text-center md:grid-cols-3">
              <div className="rounded-2xl border border-stone-400/30 bg-white/55 p-6 shadow-sm backdrop-blur-sm">
                <p className="text-3xl font-bold text-stone-900">Access</p>
                <p className="mt-2 text-sm text-stone-700">Help attendees discover events they care about quickly.</p>
              </div>
              <div className="rounded-2xl border border-stone-400/30 bg-white/55 p-6 shadow-sm backdrop-blur-sm">
                <p className="text-3xl font-bold text-stone-900">Trust</p>
                <p className="mt-2 text-sm text-stone-700">Give organisers tools to launch and manage events confidently.</p>
              </div>
              <div className="rounded-2xl border border-stone-400/30 bg-white/55 p-6 shadow-sm backdrop-blur-sm">
                <p className="text-3xl font-bold text-stone-900">Connection</p>
                <p className="mt-2 text-sm text-stone-700">Create real-world moments that strengthen communities.</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      <Footer tone="dark" />
    </main>
  )
}
