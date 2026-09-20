import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { BookingStatus } from "@/lib/generated/prisma";
import { demoBookings } from "@/lib/demo-data";

const DEMO_STATS = {
  totalBookings: demoBookings.length,
  upcomingBookings: demoBookings.filter((booking) => booking.status === 'CONFIRMED').length,
  completedBookings: demoBookings.filter((booking) => booking.status === 'COMPLETED').length,
  cancelledBookings: 0,
  totalSpent: demoBookings.filter((booking) => booking.status === 'COMPLETED').reduce((sum, booking) => sum + booking.finalAmount, 0),
};

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL?.trim()) {
    return Response.json(DEMO_STATS);
  }

  const session = await auth.api.getSession({
    headers: await headers()
  }).catch(() => null);

  // Return demo stats for unauthenticated users
  if (!session || !session.user) {
    return Response.json(DEMO_STATS);
  }

  try {
    const requestId = crypto.randomUUID();

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
      },
      message: 'Fetching user booking statistics',
    });

    const userId = session.user.id;
    const now = new Date();

    // Get booking statistics
    const [
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      totalSpentResult
    ] = await Promise.all([
      // Total bookings
      prisma.booking.count({
        where: { userId }
      }),
      
      // Upcoming bookings (confirmed and future)
      prisma.booking.count({
        where: {
          userId,
          status: BookingStatus.CONFIRMED,
          bookingDate: { gte: now.toISOString().split('T')[0] }
        }
      }),
      
      // Completed bookings
      prisma.booking.count({
        where: {
          userId,
          status: BookingStatus.COMPLETED
        }
      }),
      
      // Cancelled bookings
      prisma.booking.count({
        where: {
          userId,
          status: BookingStatus.CANCELLED
        }
      }),
      
      // Total amount spent (only completed bookings)
      prisma.booking.aggregate({
        where: {
          userId,
          status: BookingStatus.COMPLETED
        },
        _sum: {
          finalAmount: true
        }
      })
    ]);

    const stats = {
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      totalSpent: totalSpentResult._sum.finalAmount || 0,
    };

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        stats
      },
      message: 'Successfully fetched user booking statistics',
    });

    return Response.json(stats);

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to fetch user booking statistics',
    });
    return new Response('Internal Server Error', { status: 500 });
  }
}
