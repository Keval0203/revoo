import { prisma } from '../lib/prisma/prismaClient';

async function main() {
  const coordsMap: Record<string, { lat: number; lng: number }> = {
    'Sabarmati Sports Arena': { lat: 23.0225, lng: 72.5714 },
    'Sardar Patel Tennis Club': { lat: 23.0366, lng: 72.5612 },
    'Kankaria Football Turf': { lat: 23.0062, lng: 72.6026 },
    'Diamond City Sports Hub': { lat: 21.1702, lng: 72.8311 },
    'Alkapuri Cricket Ground': { lat: 22.3072, lng: 73.1812 },
    'Capital City Sports Complex': { lat: 23.2156, lng: 72.6369 },
  };

  for (const [name, coords] of Object.entries(coordsMap)) {
    await prisma.facility.updateMany({
      where: { name },
      data: {
        latitude: coords.lat,
        longitude: coords.lng,
      },
    });
    console.log(`Updated ${name} with lat=${coords.lat}, lng=${coords.lng}`);
  }
}

main().then(() => process.exit(0)).catch(console.error);
