import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { safeToISOString, safeFormatTime } from "@/lib/utils/dateHelpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { sessionId } = await params;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        sessionId,
      },
      message: "Fetching booking details by session ID.",
    });

    // Try finding booking directly by ID
    const directBooking = await prisma.booking.findUnique({
      where: { id: sessionId },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
          },
        },
        payment: {
          select: {
            status: true,
            paidAt: true,
            transactionId: true,
            gatewayPaymentId: true,
          },
        },
      },
    });

    if (directBooking) {
      const bookingData = {
        id: directBooking.id,
        status: directBooking.status,
        bookingDate: safeToISOString(directBooking.bookingDate),
        startTime: safeFormatTime(directBooking.startTime),
        endTime: safeFormatTime(directBooking.endTime),
        totalAmount: directBooking.totalAmount,
        finalAmount: directBooking.finalAmount,
        specialRequests: directBooking.specialRequests,
        facility: directBooking.facility,
        court: directBooking.court,
        payment: directBooking.payment || {
          status: "COMPLETED",
          paidAt: directBooking.createdAt.toISOString(),
          transactionId: `TXN_${directBooking.id}`,
        },
      };

      return Response.json({
        booking: bookingData,
        session: {
          id: sessionId,
          paymentStatus: "paid",
        },
      });
    }

    return Response.json({ error: "Booking not found" }, { status: 404 });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch booking details by session ID.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
