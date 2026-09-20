import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      const now = Date.now();
      return Response.json([
        { id: "demo-activity-1", action: "BOOKING_CREATED", description: "Aarav Mehta created a new booking", createdAt: new Date(now - 12 * 60 * 1000).toISOString() },
        { id: "demo-activity-2", action: "FACILITY_REGISTRATION", description: "New facility registration submitted", createdAt: new Date(now - 45 * 60 * 1000).toISOString() },
        { id: "demo-activity-3", action: "PAYMENT_COMPLETED", description: "Payment completed for booking", createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
        { id: "demo-activity-4", action: "USER_REGISTRATION", description: "Riya Sharma registered on the platform", createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString() },
      ]);
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    // Get recent activity logs
    const activityLogs = await prisma.activityLog.findMany({
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform activity logs into readable format
    const activities = activityLogs.map((log) => {
      let description = "";
      
      switch (log.action) {
        case "USER_REGISTRATION":
          description = `${log.user?.name || "Unknown user"} registered on the platform`;
          break;
        case "FACILITY_REGISTRATION":
          description = `New facility registration submitted`;
          break;
        case "BOOKING_CREATED":
          description = `${log.user?.name || "Unknown user"} created a new booking`;
          break;
        case "PAYMENT_COMPLETED":
          description = `Payment completed for booking`;
          break;
        case "REVIEW_SUBMITTED":
          description = `${log.user?.name || "Unknown user"} submitted a review`;
          break;
        default:
          description = `${log.action} performed by ${log.user?.name || "Unknown user"}`;
      }

      return {
        id: log.id,
        action: log.action,
        description,
        createdAt: log.createdAt,
        userId: log.userId,
        entityId: log.entityId,
      };
    });

    return Response.json(activities);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch recent activity",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
