import { prisma } from '../lib/prisma/prismaClient';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";

async function runOptimizedOwnerRevenue(ownerId: string) {
  // 1. Get owner's facilities
  const ownerFacilities = await prisma.facility.findMany({
    where: { ownerId },
    select: { id: true, name: true },
  });

  const facilityIds = ownerFacilities.map(f => f.id);
  if (facilityIds.length === 0) {
    return {
      totalRevenue: 0,
      revenueGrowth: 0,
      monthlyRevenue: [],
      facilityRevenue: [],
      recentTransactions: [],
    };
  }

  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);
  const previousStartDate = startOfMonth(subMonths(now, 1));
  const previousEndDate = endOfMonth(subMonths(now, 1));

  const twelveMonthsStart = startOfMonth(subMonths(now, 11));
  const twelveMonthsEnd = endOfMonth(now);

  const [
    currentRevenueRes,
    previousRevenueRes,
    monthlyPaymentsRes,
    facilityPaymentsRes,
    recentTransactionsRes,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        booking: { facilityId: { in: facilityIds } },
        status: "COMPLETED",
        paidAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { facilityId: { in: facilityIds } },
        status: "COMPLETED",
        paidAt: { gte: previousStartDate, lte: previousEndDate },
      },
      _sum: { totalAmount: true },
    }),
    prisma.payment.findMany({
      where: {
        booking: { facilityId: { in: facilityIds } },
        status: "COMPLETED",
        paidAt: { gte: twelveMonthsStart, lte: twelveMonthsEnd },
      },
      select: { paidAt: true, totalAmount: true },
    }),
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

  const currentTotal = currentRevenueRes._sum.totalAmount || 0;
  const previousTotal = previousRevenueRes._sum.totalAmount || 0;
  const revenueGrowth = previousTotal > 0
    ? ((currentTotal - previousTotal) / previousTotal) * 100
    : 0;

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

  return {
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
  };
}

async function main() {
  const facility = await prisma.facility.findFirst({
    select: { ownerId: true, owner: { select: { email: true, role: true } } }
  });

  if (!facility) {
    console.log("No facility found in DB");
    return;
  }

  console.log("Testing with ownerId:", facility.ownerId, "(", facility.owner.email, ")");
  const result = await runOptimizedOwnerRevenue(facility.ownerId);
  console.log("Result summary:");
  console.log("- totalRevenue:", result.totalRevenue);
  console.log("- revenueGrowth:", result.revenueGrowth);
  console.log("- monthlyRevenue count:", result.monthlyRevenue.length);
  console.log("- sample monthlyRevenue:", result.monthlyRevenue.slice(-3));
  console.log("- facilityRevenue count:", result.facilityRevenue.length);
  console.log("- sample facilityRevenue:", result.facilityRevenue);
  console.log("- recentTransactions count:", result.recentTransactions.length);
}

main().then(() => process.exit(0)).catch(console.error);
