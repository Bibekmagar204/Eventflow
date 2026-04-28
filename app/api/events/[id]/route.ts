// app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/events/:id
// Returns a single event with seat availability count
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organiser: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            seats: true,
            tickets: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Count available seats separately
    const availableSeats = await prisma.seat.count({
      where: { eventId: id, isAvailable: true },
    });

    return NextResponse.json({
      data: { ...event, availableSeats },
    });
  } catch (err) {
    console.error("[GET /api/events/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/events/:id
// Organiser only — update event details or toggle published
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ORGANISER") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // Make sure this organiser owns the event
    const existing = await prisma.event.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existing.organiserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Only allow these fields to be updated
    const { title, description, date, venue, price, published, imageUrl } = body;

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(venue !== undefined && { venue }),
        ...(price !== undefined && { price }),
        ...(published !== undefined && { published }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/events/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/events/:id
// Organiser only — deletes event and cascades to seats
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ORGANISER") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const existing = await prisma.event.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existing.organiserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete seats first, then event (foreign key order)
    await prisma.$transaction([
      prisma.seat.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    console.error("[DELETE /api/events/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}