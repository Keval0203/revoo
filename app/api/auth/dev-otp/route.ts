import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prismaClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "Email query param required" }, { status: 400 });
    }

    // 1. Check in-memory store
    const g = globalThis as any;
    const inMem = g.__revo_otps?.get(email);
    if (inMem && Date.now() - inMem.createdAt < 15 * 60 * 1000) {
      return NextResponse.json({
        otp: inMem.otp,
        type: inMem.type,
        source: "memory",
      });
    }

    // 2. Check prisma verification table
    // better-auth emailOTP saves identifier as email or email:type or similar
    const records = await prisma.verification.findMany({
      where: {
        identifier: {
          contains: email,
        },
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    if (records.length > 0) {
      return NextResponse.json({
        otp: records[0].value,
        source: "database",
      });
    }

    return NextResponse.json({
      otp: null,
      message: "No active OTP found for this email yet.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
