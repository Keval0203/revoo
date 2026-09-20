import { prisma } from '../lib/prisma/prismaClient';

async function testQuery() {
  const bookings = await prisma.booking.findMany({
    take: 3,
    include: {
      facility: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          latitude: true,
          longitude: true,
          phone: true,
          rating: true,
          totalReviews: true,
        }
      }
    }
  });

  console.log("Found bookings count:", bookings.length);
  if (bookings.length > 0) {
    console.log("Sample facility:", JSON.stringify(bookings[0].facility, null, 2));
  }
}

testQuery().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
