import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check user role
  if (session.user.role !== "facility_owner") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "7d";

    let days = 7;
    switch (period) {
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 7;
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "fetch_revenue_analytics",
        period,
      },
      message: "Fetching revenue analytics for facility owner",
    });

    const userId = session.user.id;
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    // Create array of dates for the period
    const dateArray = [];
    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, i);
      dateArray.unshift(format(date, "yyyy-MM-dd"));
    }

    const overallStart = startOfDay(startDate);
    const overallEnd = endOfDay(endDate);

    // Fetch all relevant bookings in one batched query instead of N+1 daily queries
    const bookings = await prisma.booking.findMany({
      where: {
        facility: {
          ownerId: userId,
        },
        createdAt: {
          gte: overallStart,
          lte: overallEnd,
        },
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      select: {
        createdAt: true,
        finalAmount: true,
      },
    });

    // Aggregate daily totals in memory
    const dailyMap = new Map<string, { revenue: number; bookings: number }>();
    for (const b of bookings) {
      const dateStr = format(b.createdAt, "yyyy-MM-dd");
      const existing = dailyMap.get(dateStr) || { revenue: 0, bookings: 0 };
      existing.revenue += b.finalAmount || 0;
      existing.bookings += 1;
      dailyMap.set(dateStr, existing);
    }

    const revenueData = dateArray.map((date) => {
      const entry = dailyMap.get(date) || { revenue: 0, bookings: 0 };
      return {
        date,
        revenue: entry.revenue,
        bookings: entry.bookings,
      };
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        period,
        dataPoints: revenueData.length,
      },
      message: "Revenue analytics fetched successfully",
    });

    return Response.json({
      data: revenueData,
      period,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session.user.id,
      },
      message: "Failed to fetch revenue analytics",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
