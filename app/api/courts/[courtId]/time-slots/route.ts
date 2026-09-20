import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { demoVenues } from "@/lib/demo-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await params;
    if (!process.env.DATABASE_URL?.trim()) {
      const { searchParams } = new URL(request.url);
      const dateStr = searchParams.get("date");
      if (!dateStr) return Response.json({ error: "Date parameter is required" }, { status: 400 });

      const source = demoVenues.flatMap((venue) => venue.courts.map((court, index) => ({
        ...court,
        id: `${venue.id}-court-${index + 1}`,
        name: `${court.sportType.replace('_', ' ')} Court ${index + 1}`,
        facility: { id: venue.id, name: venue.name },
      }))).find((court) => court.id === courtId);
      if (!source) return Response.json({ error: "Court not found or inactive" }, { status: 404 });

      const timeSlots = Array.from({ length: 10 }, (_, index) => {
        const hour = 9 + index;
        return {
          id: `${courtId}-${dateStr}-${hour}`,
          startTime: `${String(hour).padStart(2, '0')}:00`,
          endTime: `${String(hour + 1).padStart(2, '0')}:00`,
          price: source.pricePerHour,
          isBooked: index === 3,
          isBlocked: false,
          available: index !== 3,
        };
      });

      return Response.json({
        court: { id: source.id, name: source.name, pricePerHour: source.pricePerHour, facility: source.facility },
        timeSlots,
        operatingHours: { openTime: "09:00", closeTime: "19:00", isClosed: false },
        isUnderMaintenance: false,
      });
    }

    // Session is optional — unauthenticated users can still browse time slots
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    
    if (!dateStr) {
      return Response.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return Response.json(
        { error: "Cannot book for past dates" },
        { status: 400 }
      );
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session?.user?.id ?? 'anonymous',
        courtId,
        date: dateStr,
      },
      message: "Fetching time slots for court.",
    });

    // First verify the court exists and is active
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        isActive: true,
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            operatingHours: true,
          },
        },
      },
    });

    if (!court) {
      return Response.json(
        { error: "Court not found or inactive" },
        { status: 404 }
      );
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();

    // Get operating hours for this day
    const operatingHour = court.facility.operatingHours.find(
      (oh) => oh.dayOfWeek === dayOfWeek
    );

    if (!operatingHour || operatingHour.isClosed) {
      return Response.json({
        court: {
          id: court.id,
          name: court.name,
          pricePerHour: court.pricePerHour,
        },
        timeSlots: [],
        message: "Facility is closed on this day",
      });
    }

    // Get existing time slots for this court and date
    const existingTimeSlots = await prisma.timeSlot.findMany({
      where: {
        courtId,
        date: {
          equals: date,
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Check for maintenance schedules
    const maintenanceSchedules = await prisma.maintenance.findMany({
      where: {
        courtId,
        isActive: true,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    const isUnderMaintenance = maintenanceSchedules.length > 0;

    // Generate available time slots if none exist
    let timeSlots = existingTimeSlots;
    
    if (timeSlots.length === 0 && !isUnderMaintenance) {
      // Generate time slots based on operating hours
      const openTime = operatingHour.openTime; // "09:00"
      const closeTime = operatingHour.closeTime; // "22:00"
      
      const [openHour, openMinute] = openTime.split(':').map(Number);
      const [closeHour, closeMinute] = closeTime.split(':').map(Number);
      
      const slots = [];
      const slotDuration = 60; // 1 hour slots
      
      for (let hour = openHour; hour < closeHour; hour++) {
        // Create proper Date objects for time values on the selected date
        const startDate = new Date(date);
        startDate.setHours(hour, openMinute, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(hour + 1, openMinute, 0, 0);
        
        // Don't create slots that go beyond closing time
        const endHour = hour + 1;
        if (endHour <= closeHour || (endHour === closeHour && openMinute <= closeMinute)) {
          try {
            const uniqueHashId = Math.floor(Date.now() / 1000) % 50000000 + Math.floor(Math.random() * 100000);
            const slot = await prisma.timeSlot.create({
              data: {
                hashId: uniqueHashId,
                courtId,
                date,
                startTime: startDate,
                endTime: endDate,
                price: court.pricePerHour,
              },
            });
            slots.push(slot);
          } catch (slotErr) {
            // Ignore duplicate creation errors gracefully
          }
        }
      }
      
      // Re-fetch all slots for court and date
      timeSlots = await prisma.timeSlot.findMany({
        where: { courtId, date: { equals: date } },
        orderBy: { startTime: "asc" },
      });
    }

    // For today, filter out past time slots
    if (date.toDateString() === today.toDateString()) {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      
      timeSlots = timeSlots.filter((slot) => {
        // startTime is a Date object with time information
        const slotHour = slot.startTime.getHours();
        const slotMinute = slot.startTime.getMinutes();
        return slotHour > currentHour || (slotHour === currentHour && slotMinute > currentMinute);
      });
    }

    // Mark slots as blocked if under maintenance
    if (isUnderMaintenance) {
      timeSlots = timeSlots.map((slot) => ({
        ...slot,
        isBlocked: true,
        blockReason: "Under maintenance",
      }));
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session?.user?.id ?? 'anonymous',
        courtId,
        date: dateStr,
        timeSlotsCount: timeSlots.length,
        isUnderMaintenance,
      },
      message: "Time slots fetched successfully.",
    });

    return Response.json({
      court: {
        id: court.id,
        name: court.name,
        pricePerHour: court.pricePerHour,
        facility: court.facility,
      },
      timeSlots: timeSlots.map((slot) => ({
        id: slot.id,
        startTime: `${slot.startTime.getHours().toString().padStart(2, '0')}:${slot.startTime.getMinutes().toString().padStart(2, '0')}`,
        endTime: `${slot.endTime.getHours().toString().padStart(2, '0')}:${slot.endTime.getMinutes().toString().padStart(2, '0')}`,
        price: slot.price || court.pricePerHour,
        isBooked: slot.isBooked,
        isBlocked: slot.isBlocked,
        blockReason: slot.blockReason,
        available: !slot.isBooked && !slot.isBlocked,
      })),
      operatingHours: {
        openTime: operatingHour.openTime,
        closeTime: operatingHour.closeTime,
        isClosed: operatingHour.isClosed,
      },
      isUnderMaintenance,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch time slots.",
    });
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
