import { prisma } from '../lib/prisma/prismaClient';

async function main() {
  const facilities = await prisma.facility.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
    }
  });

  console.log("Facilities count:", facilities.length);
  for (const f of facilities) {
    console.log(`- ${f.name} (${f.city}): lat=${f.latitude}, lng=${f.longitude}`);
  }
}

main().then(() => process.exit(0)).catch(console.error);
