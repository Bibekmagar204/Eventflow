// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations";

// GET /api/events
// - ORGANISER: returns only their own events
// - Everyone else: returns all events
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "true";

    // If organiser requests their own events
    if (mine) {
      if (!session || session.user.role !== "ORGANISER") {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      }

      const events = await prisma.event.findMany({
        where: { organiserId: session.user.id },
        include: {
          _count: { select: { seats: true } },
        },
        orderBy: { date: "asc" },
      });

      return NextResponse.json({ data: events });
    }

    // Public: return all events
    const events = await prisma.event.findMany({
      include: {
        organiser: { select: { name: true } },
        _count: { select: { seats: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ data: events });
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/events
// Organiser only — creates event + seeds Seat rows
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ORGANISER") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await req.json();

    // Validate with Zod
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, date, venue, capacity, price } = parsed.data;

    // Create event + seats in a single transaction
    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          title,
          description: description ?? "",
          date: new Date(date),
          venue,
          capacity,
          price,
          organiserId: session.user.id,
        },
      });

      // Seed one Seat row per capacity slot (general admission)
      const seats = Array.from({ length: capacity }, (_, i) => ({
        eventId: newEvent.id,
        label: `GA-${i + 1}`,
        isAvailable: true,
      }));

      await tx.seat.createMany({ data: seats });

      return newEvent;
    });

    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}