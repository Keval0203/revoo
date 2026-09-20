import { prisma } from '../lib/prisma/prismaClient';

async function testAdminCharts() {
  const now = new Date();
  const monthBuckets = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const mStart = new Date(year, month, 1, 0, 0, 0, 0);
    const mEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const name = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    monthBuckets.push({ name, mStart, mEnd });
  }

  const sixMonthsStart = monthBuckets[0].mStart;
  const sixMonthsEnd = monthBuckets[monthBuckets.length - 1].mEnd;

  const [
    bookingsRes,
    usersRes,
    sportPopularityRaw,
    paymentsRes,
    facilitiesRes,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: { createdAt: { gte: sixMonthsStart, lte: sixMonthsEnd } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsStart, lte: sixMonthsEnd } },
      select: { createdAt: true },
    }),
    prisma.booking.groupBy({
      by: ["courtId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: sixMonthsStart, lte: sixMonthsEnd },
      },
      select: { createdAt: true, totalAmount: true },
    }),
    prisma.facility.findMany({
      where: {
        OR: [
          { status: "PENDING", createdAt: { gte: sixMonthsStart, lte: sixMonthsEnd } },
          { status: "APPROVED", approvedAt: { gte: sixMonthsStart, lte: sixMonthsEnd } },
          { status: "REJECTED", rejectedAt: { gte: sixMonthsStart, lte: sixMonthsEnd } },
        ],
      },
      select: { status: true, createdAt: true, approvedAt: true, rejectedAt: true },
    }),
  ]);

  const courtIds = sportPopularityRaw.map((s) => s.courtId);
  const courts = courtIds.length > 0
    ? await prisma.court.findMany({
        where: { id: { in: courtIds } },
        select: { id: true, sportType: true },
      })
    : [];

  const courtMap = new Map<string, string>();
  courts.forEach((c) => courtMap.set(c.id, c.sportType));

  const sportMap = new Map<string, number>();
  sportPopularityRaw.forEach((sport) => {
    const sportName = courtMap.get(sport.courtId) || "Unknown";
    sportMap.set(sportName, (sportMap.get(sportName) || 0) + sport._count.id);
  });

  const aggregatedSportPopularity = Array.from(sportMap.entries()).map(([name, bookings]) => ({
    name,
    bookings,
  }));

  const bookingTrend = monthBuckets.map((bucket) => ({
    month: bucket.name,
    bookings: bookingsRes.filter((b) => b.createdAt >= bucket.mStart && b.createdAt <= bucket.mEnd).length,
  }));

  const userRegistrationTrend = monthBuckets.map((bucket) => ({
    month: bucket.name,
    users: usersRes.filter((u) => u.createdAt >= bucket.mStart && u.createdAt <= bucket.mEnd).length,
  }));

  const revenueTrend = monthBuckets.map((bucket) => ({
    month: bucket.name,
    revenue: paymentsRes
      .filter((p) => p.createdAt >= bucket.mStart && p.createdAt <= bucket.mEnd)
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
  }));

  const facilityApprovalTrend = monthBuckets.map((bucket) => {
    let pending = 0, approved = 0, rejected = 0;
    for (const f of facilitiesRes) {
      if (f.status === "PENDING" && f.createdAt >= bucket.mStart && f.createdAt <= bucket.mEnd) pending++;
      if (f.status === "APPROVED" && f.approvedAt && f.approvedAt >= bucket.mStart && f.approvedAt <= bucket.mEnd) approved++;
      if (f.status === "REJECTED" && f.rejectedAt && f.rejectedAt >= bucket.mStart && f.rejectedAt <= bucket.mEnd) rejected++;
    }
    return { month: bucket.name, pending, approved, rejected };
  });

  return {
    bookingTrend,
    userRegistrationTrend,
    sportPopularity: aggregatedSportPopularity,
    revenueTrend,
    facilityApprovalTrend,
  };
}

async function testAdminStats() {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [
    totalUsers,
    totalFacilities,
    activeBookings,
    activeCourts,
    totalRevenue,
    lastMonthUsers,
    lastMonthFacilities,
    lastMonthBookings,
    lastMonthCourts,
    lastMonthRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.facility.count({ where: { status: "APPROVED", isActive: true } }),
    prisma.booking.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
    prisma.court.count({ where: { isActive: true } }),
    prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { status: "COMPLETED" } }),
    prisma.user.count({ where: { createdAt: { lte: lastMonth } } }),
    prisma.facility.count({ where: { status: "APPROVED", isActive: true, createdAt: { lte: lastMonth } } }),
    prisma.booking.count({ where: { status: { in: ["PENDING", "CONFIRMED"] }, createdAt: { lte: lastMonth } } }),
    prisma.court.count({ where: { isActive: true, createdAt: { lte: lastMonth } } }),
    prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { status: "COMPLETED", createdAt: { lte: lastMonth } } }),
  ]);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    totalUsers,
    totalFacilities,
    activeBookings,
    activeCourts,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    userGrowth: Math.round(calculateGrowth(totalUsers, lastMonthUsers)),
    facilityGrowth: Math.round(calculateGrowth(totalFacilities, lastMonthFacilities)),
    bookingGrowth: Math.round(calculateGrowth(activeBookings, lastMonthBookings)),
    courtGrowth: Math.round(calculateGrowth(activeCourts, lastMonthCourts)),
    revenueGrowth: Math.round(
      calculateGrowth(
        totalRevenue._sum.totalAmount || 0,
        lastMonthRevenue._sum.totalAmount || 0
      )
    ),
  };
}

async function main() {
  console.log("=== Testing Admin Charts Optimization ===");
  const chartsResult = await testAdminCharts();
  console.log("Charts Output Keys:", Object.keys(chartsResult));
  console.log("Booking Trend Months:", chartsResult.bookingTrend.map(b => `${b.month}: ${b.bookings}`));
  console.log("User Registration Trend:", chartsResult.userRegistrationTrend.map(u => `${u.month}: ${u.users}`));
  console.log("Sport Popularity:", chartsResult.sportPopularity);
  console.log("Revenue Trend:", chartsResult.revenueTrend.map(r => `${r.month}: ${r.revenue}`));
  console.log("Facility Approval Trend:", chartsResult.facilityApprovalTrend);

  console.log("\n=== Testing Admin Stats Optimization ===");
  const statsResult = await testAdminStats();
  console.log("Stats Output:", JSON.stringify(statsResult, null, 2));
}

main().then(() => process.exit(0)).catch(console.error);
