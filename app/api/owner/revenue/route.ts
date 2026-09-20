import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { z } from "zod";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";

const revenueQuerySchema = z.object({
  period: z.enum(["month", "year", "custom"]).optional().default("month"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  facilityId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "facility_owner" && session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const validatedQuery = revenueQuerySchema.parse({
      period: searchParams.get("period") || "month",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      facilityId: searchParams.get("facilityId") || undefined,
    });

    // 1. Get owner's facilities (Query Step 1)
    const ownerFacilities = await prisma.facility.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true },
    });

    const ownerFacilityIds = ownerFacilities.map(f => f.id);
    const facilityIds = validatedQuery.facilityId 
      ? (ownerFacilityIds.includes(validatedQuery.facilityId) ? [validatedQuery.facilityId] : [])
      : ownerFacilityIds;

    if (facilityIds.length === 0) {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          action: "get_revenue",
        },
        message: "Owner has no facilities",
      });

      return Response.json({
        totalRevenue: 0,
        revenueGrowth: 0,
        monthlyRevenue: [],
        facilityRevenue: [],
        recentTransactions: [],
      });
    }

    // Calculate date range for current & previous periods
    const now = new Date();
    let startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date;

    switch (validatedQuery.period) {
      case "year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        previousStartDate = startOfYear(subYears(now, 1));
        previousEndDate = endOfYear(subYears(now, 1));
        break;
      case "custom":
        if (!validatedQuery.startDate || !validatedQuery.endDate) {
          return new Response("Start date and end date required for custom period", { status: 400 });
        }
        startDate = new Date(validatedQuery.startDate);
        endDate = new Date(validatedQuery.endDate);
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        previousStartDate = new Date(startDate.getTime() - diffDays * 24 * 60 * 60 * 1000);
        previousEndDate = new Date(endDate.getTime() - diffDays * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
        break;
    }

    // Calculate 12-month window bounds for getMonthlyRevenue
    const twelveMonthsStart = startOfMonth(subMonths(now, 11));
    const twelveMonthsEnd = endOfMonth(now);

    // 2. Execute all remaining queries concurrently in a single batch (Query Step 2)
    const [
      currentRevenueRes,
      previousRevenueRes,
      monthlyPaymentsRes,
      facilityPaymentsRes,
      recentTransactionsRes,
    ] = await Promise.all([
      // Current period total revenue
      prisma.payment.aggregate({
        where: {
          booking: { facilityId: { in: facilityIds } },
          status: "COMPLETED",
          paidAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
      // Previous period total revenue for growth calculation
      prisma.payment.aggregate({
        where: {
          booking: { facilityId: { in: facilityIds } },
          status: "COMPLETED",
          paidAt: { gte: previousStartDate, lte: previousEndDate },
        },
        _sum: { totalAmount: true },
      }),
      // Batched 12-month revenue query (replaces 12 sequential queries)
      prisma.payment.findMany({
        where: {
          booking: { facilityId: { in: facilityIds } },
          status: "COMPLETED",
          paidAt: { gte: twelveMonthsStart, lte: twelveMonthsEnd },
        },
        select: { paidAt: true, totalAmount: true },
      }),
      // Batched facility revenue query (replaces N facility queries)
      prisma.payment.findMany({
        where: {
          booking: { facilityId: { in: facilityIds } },
          status: "COMPLETED",
          paidAt: { gte: startDate, lte: endDate },
        },
        select: {
          totalAmount: true,
          booking: { select: { facilityId: true } },
        },
      }),
      // Recent transactions (10 most recent)
      prisma.payment.findMany({
        where: {
          booking: { facilityId: { in: facilityIds } },
          status: "COMPLETED",
        },
        include: {
          booking: {
            include: {
              user: { select: { name: true, email: true } },
              facility: { select: { name: true } },
              court: { select: { name: true } },
            },
          },
        },
        orderBy: { paidAt: "desc" },
        take: 10,
      }),
    ]);

    // Process total & growth
    const currentTotal = currentRevenueRes._sum.totalAmount || 0;
    const previousTotal = previousRevenueRes._sum.totalAmount || 0;
    const revenueGrowth = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

    // Process monthly revenue in memory
    const monthlyBuckets = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const label = monthDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      monthlyBuckets.push({
        mStart,
        mEnd,
        month: label,
        revenue: 0,
      });
    }

    for (const payment of monthlyPaymentsRes) {
      if (!payment.paidAt) continue;
      const pTime = new Date(payment.paidAt).getTime();
      for (const bucket of monthlyBuckets) {
        if (pTime >= bucket.mStart.getTime() && pTime <= bucket.mEnd.getTime()) {
          bucket.revenue += payment.totalAmount;
          break;
        }
      }
    }

    const monthlyRevenue = monthlyBuckets.map(({ month, revenue }) => ({
      month,
      revenue,
    }));

    // Process facility revenue in memory
    const facilityRevenueMap = new Map<string, { revenue: number; transactions: number }>();
    for (const fp of facilityPaymentsRes) {
      const fId = fp.booking.facilityId;
      const existing = facilityRevenueMap.get(fId) || { revenue: 0, transactions: 0 };
      existing.revenue += fp.totalAmount;
      existing.transactions += 1;
      facilityRevenueMap.set(fId, existing);
    }

    const facilityRevenueData = ownerFacilities
      .filter(f => facilityIds.includes(f.id))
      .map((facility) => {
        const stats = facilityRevenueMap.get(facility.id) || { revenue: 0, transactions: 0 };
        return {
          facilityId: facility.id,
          facilityName: facility.name,
          revenue: stats.revenue,
          transactions: stats.transactions,
        };
      });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "get_revenue",
        period: validatedQuery.period,
        totalRevenue: currentTotal,
      },
      message: "Successfully retrieved revenue data",
    });

    return Response.json({
      totalRevenue: currentTotal,
      revenueGrowth,
      monthlyRevenue,
      facilityRevenue: facilityRevenueData,
      recentTransactions: recentTransactionsRes.map((transaction) => ({
        id: transaction.id,
        amount: transaction.totalAmount,
        paidAt: transaction.paidAt,
        customer: transaction.booking.user.name,
        facility: transaction.booking.facility.name,
        court: transaction.booking.court.name,
        paymentMethod: transaction.paymentMethod,
      })),
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch revenue data",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
