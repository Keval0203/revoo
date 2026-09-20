import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { 
  validateBooking,
  createValidationErrorResponse 
} from "@/lib/utils/bookingValidation";
import { demoBookings } from "@/lib/demo-data";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    if (!process.env.DATABASE_URL?.trim()) {
      const booking = demoBookings.find((item) => item.id === bookingId);
      if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
      if (booking.status !== 'PENDING') return Response.json({ error: 'Booking is no longer available for payment' }, { status: 400 });
      return Response.json({ checkoutUrl: '/booking/success?demo=true' });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    // Demo mode fallback for unauthenticated users
    if (!session || !session.user) {
      const booking = demoBookings.find((item) => item.id === bookingId);
      if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
      if (booking.status !== 'PENDING') return Response.json({ error: 'Booking is no longer available for payment' }, { status: 400 });
      return Response.json({ checkoutUrl: '/booking/success?demo=true' });
    }

    const body = await request.json();
    const { successUrl } = body;

    const requestId = crypto.randomUUID();

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        bookingId,
      },
      message: "Retrying payment for booking.",
    });

    // Fetch the booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        userId: session.user.id, // Ensure user can only retry their own bookings
      },
      include: {
        facility: true,
        court: true,
        timeSlot: true,
        payment: true,
        user: true,
      },
    });

    if (!booking) {
      globalThis?.logger?.warn({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
        },
        message: "Booking not found for payment retry.",
      });
      return Response.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Validate booking data
    const bookingValidation = validateBooking(booking);
    if (!bookingValidation.isValid) {
      globalThis?.logger?.error({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
          errors: bookingValidation.errors,
        },
        message: "Invalid booking data encountered during payment retry.",
      });
      return createValidationErrorResponse(
        ["Invalid booking data. Please contact support."],
        500
      );
    }

    // Check if booking is still eligible for payment retry
    if (booking.status !== "PENDING") {
      globalThis?.logger?.warn({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
          status: booking.status,
        },
        message: "Booking is no longer available for payment retry.",
      });
      return Response.json(
        { error: "Booking is no longer available for payment" },
        { status: 400 }
      );
    }

    // Confirm the booking
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      }),
      prisma.timeSlot.update({
        where: { id: booking.timeSlotId },
        data: { isBooked: true },
      }),
    ]);

    const redirectUrl = successUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/booking/success?session_id=${booking.id}`;

    return Response.json({
      bookingId: booking.id,
      checkoutUrl: redirectUrl,
      sessionId: booking.id,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to retry payment for booking.",
    });
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}