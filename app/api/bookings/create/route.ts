import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { 
  safeCreateDateTime, 
  safeCalculateHours, 
  safeFormatTime,
  safeToDate 
} from "@/lib/utils/dateHelpers";
import { 
  validateBookingCreationInput, 
  validateTimeSlot,
  createValidationErrorResponse 
} from "@/lib/utils/bookingValidation";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      const body = await request.json();
      if (!body.facilityId || !body.courtId || !body.timeSlotId || !body.userDetails?.fullName || !body.userDetails?.email || !body.userDetails?.phone) {
        return Response.json({ error: "Please provide the required booking details" }, { status: 400 });
      }
      return Response.json({
        bookingId: "demo-booking-new",
        checkoutUrl: "/booking/success?demo=true",
        sessionId: "demo-checkout-session",
      });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    // Demo mode fallback for unauthenticated users when DB exists
    if (!session || !session.user) {
      const body = await request.json();
      if (!body.facilityId || !body.courtId || !body.timeSlotId || !body.userDetails?.fullName || !body.userDetails?.email || !body.userDetails?.phone) {
        return Response.json({ error: "Please provide the required booking details" }, { status: 400 });
      }
      return Response.json({
        bookingId: "demo-booking-new",
        checkoutUrl: "/booking/success?demo=true",
        sessionId: "demo-checkout-session",
      });
    }

    const body = await request.json();
    
    // Validate input data
    const inputValidation = validateBookingCreationInput(body);
    if (!inputValidation.isValid) {
      globalThis?.logger?.warn({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          errors: inputValidation.errors,
        },
        message: "Invalid booking creation input.",
      });
      return createValidationErrorResponse(inputValidation.errors);
    }

    const {
      facilityId,
      courtId,
      timeSlotId,
      selectedTimeSlotIds: inputSlotIds,
      specialRequests,
      couponCode,
      userDetails,
      successUrl,
      cancelUrl,
    } = inputValidation.sanitizedInput!;

    const selectedSlotIds: string[] = Array.isArray(inputSlotIds) && inputSlotIds.length > 0
      ? inputSlotIds
      : (timeSlotId ? [timeSlotId] : []);

    if (selectedSlotIds.length === 0) {
      return Response.json(
        { error: "At least one time slot must be selected." },
        { status: 400 }
      );
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId,
        courtId,
        selectedSlotIds,
      },
      message: "Creating booking request for multiple time slots.",
    });

    // Retrieve all requested time slots in one batch query
    const timeSlots = await prisma.timeSlot.findMany({
      where: { id: { in: selectedSlotIds } },
      include: {
        court: {
          include: {
            facility: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    if (timeSlots.length !== selectedSlotIds.length) {
      return Response.json(
        { error: "One or more selected time slots were not found" },
        { status: 404 }
      );
    }

    // Validate that all slots belong to the requested court and facility, and are not booked/blocked
    for (const slot of timeSlots) {
      if (slot.courtId !== courtId || slot.court.facilityId !== facilityId) {
        return Response.json(
          { error: "Selected time slot does not belong to the selected court and facility." },
          { status: 400 }
        );
      }

      if (slot.isBooked || slot.isBlocked) {
        return Response.json(
          { error: `Time slot ${safeFormatTime(slot.startTime)} - ${safeFormatTime(slot.endTime)} is already booked or blocked.` },
          { status: 400 }
        );
      }

      const slotValidation = validateTimeSlot(slot);
      if (!slotValidation.isValid) {
        return createValidationErrorResponse(slotValidation.errors, 400);
      }
    }

    // Check if any existing active booking already claims any of these slots
    const existingBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { timeSlotId: { in: selectedSlotIds } },
          { timeSlots: { some: { id: { in: selectedSlotIds } } } }
        ],
        status: { in: ["CONFIRMED", "PENDING"] }
      },
    });

    if (existingBookings.length > 0) {
      return Response.json(
        { error: "One or more selected time slots have already been booked." },
        { status: 400 }
      );
    }

    // Calculate server-side total pricing, start time, end time, and total hours across all slots
    let totalAmount = 0;
    let totalHours = 0;
    const primarySlot = timeSlots[0];
    let overallStartTime = primarySlot.startTime;
    let overallEndTime = primarySlot.endTime;

    for (const slot of timeSlots) {
      const startDateTime = safeCreateDateTime(slot.date, slot.startTime);
      const endDateTime = safeCreateDateTime(slot.date, slot.endTime);
      
      if (!startDateTime || !endDateTime) {
        return Response.json(
          { error: "Invalid time slot data. Please try again." },
          { status: 400 }
        );
      }

      const duration = safeCalculateHours(startDateTime, endDateTime);
      if (duration <= 0) {
        return Response.json(
          { error: "Invalid time slot duration encountered." },
          { status: 400 }
        );
      }

      const slotPrice = slot.price || slot.court.pricePerHour;
      totalAmount += slotPrice * duration;
      totalHours += duration;

      if (slot.startTime < overallStartTime) overallStartTime = slot.startTime;
      if (slot.endTime > overallEndTime) overallEndTime = slot.endTime;
    }

    const pricePerHour = totalHours > 0 ? totalAmount / totalHours : primarySlot.court.pricePerHour;
    const platformFee = totalAmount * 0.03; // 3% platform fee
    const tax = (totalAmount + platformFee) * 0.18; // 18% GST
    let finalAmount = totalAmount + platformFee + tax;
    let discountAmount = 0;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      if (coupon) {
        if (coupon.usageLimit && coupon.currentUsage >= coupon.usageLimit) {
          return Response.json(
            { error: "Coupon usage limit exceeded" },
            { status: 400 }
          );
        }

        if (coupon.minBookingAmount && totalAmount < coupon.minBookingAmount) {
          return Response.json(
            { error: `Minimum booking amount of ₹${coupon.minBookingAmount} required` },
            { status: 400 }
          );
        }

        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = totalAmount * (coupon.discountValue / 100);
        } else {
          discountAmount = coupon.discountValue;
        }

        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }

        finalAmount -= discountAmount;
      }
    }

    // Update user profile with booking contact details
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: userDetails.fullName,
        email: userDetails.email,
        phone: userDetails.phone,
        userProfile: {
          upsert: {
            create: {
              fullName: userDetails.fullName,
              emergencyContact: userDetails.emergencyContact || null,
              emergencyPhone: userDetails.emergencyPhone || null,
            },
            update: {
              fullName: userDetails.fullName,
              emergencyContact: userDetails.emergencyContact || null,
              emergencyPhone: userDetails.emergencyPhone || null,
            },
          },
        },
      },
    });

    const bookingStatus = "CONFIRMED";
    const newHashId = Math.floor(Date.now() / 1000) % 50000000 + Math.floor(Math.random() * 10000);

    // Execute booking creation and slot booking inside an atomic transaction
    let booking: any;
    try {
      booking = await prisma.$transaction(async (tx) => {
        // Double-check availability inside transaction to prevent double booking
        const freshSlots = await tx.timeSlot.findMany({
          where: { id: { in: selectedSlotIds } },
        });

        for (const fs of freshSlots) {
          if (fs.isBooked || fs.isBlocked) {
            throw new Error("DOUBLE_BOOKING_PREVENTED");
          }
        }

        // Create booking record
        const createdBooking = await tx.booking.create({
          data: {
            hashId: newHashId,
            userId: session.user.id,
            facilityId,
            courtId,
            timeSlotId: selectedSlotIds[0],
            bookingDate: primarySlot.date,
            startTime: overallStartTime,
            endTime: overallEndTime,
            totalHours,
            pricePerHour,
            totalAmount,
            platformFee,
            tax,
            finalAmount,
            specialRequests,
            status: bookingStatus,
            confirmedAt: new Date(),
          },
        });

        // Link all selected slots to this booking
        await tx.timeSlot.updateMany({
          where: { id: { in: selectedSlotIds } },
          data: {
            bookingId: createdBooking.id,
            isBooked: true,
          },
        });

        // Apply coupon to booking if used
        if (couponCode && discountAmount > 0) {
          const coupon = await tx.coupon.findFirst({
            where: { code: couponCode },
          });

          if (coupon) {
            await tx.bookingCoupon.create({
              data: {
                hashId: Math.floor(Date.now() / 1000) % 50000000 + Math.floor(Math.random() * 10000),
                bookingId: createdBooking.id,
                couponId: coupon.id,
                discountAmount,
              },
            });

            await tx.coupon.update({
              where: { id: coupon.id },
              data: { currentUsage: { increment: 1 } },
            });
          }
        }

        // Create payment record directly
        await tx.payment.create({
          data: {
            hashId: Math.floor(Date.now() / 1000) % 50000000 + Math.floor(Math.random() * 10000),
            bookingId: createdBooking.id,
            amount: totalAmount,
            platformFee,
            tax,
            totalAmount: finalAmount,
            paymentMethod: "CREDIT_CARD",
            paymentGateway: "direct",
            transactionId: `TXN_${createdBooking.id}`,
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });

        return createdBooking;
      });
    } catch (txError: any) {
      if (txError?.message === "DOUBLE_BOOKING_PREVENTED") {
        return Response.json(
          { error: "One or more of the selected time slots have just been booked by another user. Please select available slots." },
          { status: 400 }
        );
      }
      throw txError;
    }

    const successCheckoutUrl = `/booking/success?demo=true&session_id=${booking.id}`;
    return Response.json({
      bookingId: booking.id,
      checkoutUrl: successCheckoutUrl,
      sessionId: booking.id,
    });

  } catch (error: any) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to create booking.",
    });

    if (error?.code === "P2002") {
      return Response.json(
        { error: "This time slot has already been booked. Please choose a different slot." },
        { status: 400 }
      );
    }

    return Response.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
