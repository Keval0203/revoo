import { prisma } from '../lib/prisma/prismaClient';
import * as fs from 'fs';
import * as path from 'path';

const sportPhotos: Record<string, string> = {
  BADMINTON: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop',
  TENNIS: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop',
  FOOTBALL: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop',
  CRICKET: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop',
  BASKETBALL: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop',
  SWIMMING: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop',
  SQUASH: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop',
  VOLLEYBALL: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop',
  TABLE_TENNIS: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&auto=format&fit=crop',
  GYM: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop',
  DEFAULT: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop',
};

async function fixDatabasePhotos() {
  console.log('🔄 Updating database facility photos with high quality Unsplash URLs...');
  
  const facilities = await prisma.facility.findMany({
    include: {
      courts: true,
      photos: true,
    },
  });

  for (const facility of facilities) {
    const mainSport = facility.courts[0]?.sportType || 'DEFAULT';
    const photoUrl = sportPhotos[mainSport] || sportPhotos.DEFAULT;

    // Update or create photo
    if (facility.photos.length > 0) {
      await prisma.facilityPhoto.updateMany({
        where: { facilityId: facility.id },
        data: { url: photoUrl },
      });
    } else {
      await prisma.facilityPhoto.create({
        data: {
          facilityId: facility.id,
          url: photoUrl,
          caption: facility.name,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }
  }

  console.log(`✅ Updated photos for ${facilities.length} facilities in database.`);
}

function fixDemoDataFile() {
  console.log('🔄 Updating lib/demo-data.ts image URLs...');
  const demoDataPath = path.join(process.cwd(), 'lib', 'demo-data.ts');
  let content = fs.readFileSync(demoDataPath, 'utf8');

  // Replace all trae.ai URLs with sport matching or default Unsplash URL
  content = content.replace(
    /https:\/\/coresg-normal\.trae\.ai\/api\/ide\/v1\/text_to_image\?prompt=[^'"]+/g,
    (match) => {
      const lower = match.toLowerCase();
      if (lower.includes('badminton')) return sportPhotos.BADMINTON;
      if (lower.includes('tennis')) return sportPhotos.TENNIS;
      if (lower.includes('football') || lower.includes('turf')) return sportPhotos.FOOTBALL;
      if (lower.includes('cricket')) return sportPhotos.CRICKET;
      if (lower.includes('basketball')) return sportPhotos.BASKETBALL;
      if (lower.includes('swimming')) return sportPhotos.SWIMMING;
      if (lower.includes('squash')) return sportPhotos.SQUASH;
      if (lower.includes('volleyball')) return sportPhotos.VOLLEYBALL;
      if (lower.includes('gym')) return sportPhotos.GYM;
      return sportPhotos.DEFAULT;
    }
  );

  fs.writeFileSync(demoDataPath, content, 'utf8');
  console.log('✅ Updated lib/demo-data.ts file.');
}

async function main() {
  fixDemoDataFile();
  await fixDatabasePhotos();
}

main()
  .catch((e) => {
    console.error('❌ Error fixing photos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
