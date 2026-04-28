import { prisma } from "@/lib/prisma";
import AttendeeEventsClient, {
  AttendeeEvent,
  AttendeeEventDetail,
} from "@/components/attendee/AttendeeEventsClient";

export const dynamic = "force-dynamic";

async function getUpcomingEvents(): Promise<{
  events: AttendeeEvent[];
  prefetchedEventDetails: Record<string, AttendeeEventDetail>;
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
  });

  const mappedEvents = events.map((event) => ({
    ...event,
    date: event.date.toISOString(),
  }));

  const prefetchedEventDetails = Object.fromEntries(
    mappedEvents.map((event) => [
      event.id,
      {
        id: event.id,
        title: event.title,
        description: event.description,
        imageUrl: (event as any).imageUrl ?? null,
        date: event.date,
        venue: event.venue,
        capacity: event.capacity,
        price: event.price,
        published: event.published,
        availableSeats: Math.max(event.capacity - (event._count?.tickets ?? 0), 0),
        organiser: {
          name: event.organiser?.name ?? null,
          email: "",
        },
        _count: {
          seats: event.capacity,
          tickets: event._count?.tickets ?? 0,
        },
      } satisfies AttendeeEventDetail,
    ])
  );

  return { events: mappedEvents, prefetchedEventDetails };
}

export default async function AttendeeEventsPage() {
  try {
    const { events, prefetchedEventDetails } = await getUpcomingEvents();
    return <AttendeeEventsClient initialEvents={events} prefetchedEventDetails={prefetchedEventDetails} />;
  } catch {
    return (
      <AttendeeEventsClient
        initialEvents={[]}
        prefetchedEventDetails={{}}
        initialError="Failed to load events"
      />
    );
  }
}