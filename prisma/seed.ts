import { UserRole, VenueType, SportType, FacilityStatus } from '../lib/generated/prisma';
import { prisma } from '../lib/prisma/prismaClient';
import { demoVenues, demoBanners } from '../lib/demo-data';

const defaultCities = [
  { name: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Surat', state: 'Gujarat', country: 'India', latitude: 21.1702, longitude: 72.8311 },
  { name: 'Vadodara', state: 'Gujarat', country: 'India', latitude: 22.3072, longitude: 73.1812 },
  { name: 'Rajkot', state: 'Gujarat', country: 'India', latitude: 22.3039, longitude: 70.8022 },
  { name: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Bangalore', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567 },
];

const defaultAmenities = [
  { name: 'Parking', description: 'Ample parking space for vehicles', icon: 'Car' },
  { name: 'Changing Rooms', description: 'Clean changing rooms for players', icon: 'UserCheck' },
  { name: 'Drinking Water', description: 'Purified drinking water available', icon: 'Droplets' },
  { name: 'Floodlights', description: 'High quality lighting for evening play', icon: 'Lightbulb' },
  { name: 'Equipment Rental', description: 'Rackets, balls, and gear available on rent', icon: 'ShoppingBag' },
  { name: 'Air Conditioning', description: 'Climate-controlled indoor environment', icon: 'Wind' },
  { name: 'Locker Rooms', description: 'Secure storage lockers for valuables', icon: 'Lock' },
  { name: 'Washrooms', description: 'Hygienic restrooms', icon: 'Bath' },
  { name: 'Cafeteria', description: 'Snacks and beverages station', icon: 'Coffee' },
  { name: 'WiFi', description: 'Free high-speed internet', icon: 'Wifi' },
];

let counter = Math.floor(Date.now() / 1000) % 50000000;
function getUniqueHashId() {
  counter += 1;
  return counter;
}

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Users (Admin, Owner, User)
  console.log('Seeding users...');
  // Standard Better Auth password hash for 'Demo@1234'
  const defaultPasswordHash = 'ca66dc5c548d560b8decb43c5eef253e:1120a247cf530e52efe64bbda9434ba542b46d0e713645ebf4834635d4afbe8a7dd68280e161500f11c0b8a207028170da2afdea7a5f9f74aa53ad95491c2015';

  const initialUsers = [
    { email: 'owner@revo.com', name: 'Facility Owner', role: UserRole.facility_owner },
    { email: 'admin@revo.com', name: 'Admin User', role: UserRole.admin },
    { email: 'user@revo.com', name: 'Demo User', role: UserRole.user },
    { email: 'owner@revo.in', name: 'Facility Owner', role: UserRole.facility_owner },
    { email: 'admin@revo.in', name: 'Admin User', role: UserRole.admin },
    { email: 'player@revo.in', name: 'Demo Player', role: UserRole.user },
  ];

  let ownerUser: any = null;

  for (const u of initialUsers) {
    const userObj = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role },
      create: {
        hashId: getUniqueHashId(),
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: true,
        city: 'Ahmedabad',
        country: 'India',
      },
    });

    if (u.email === 'owner@revo.com') {
      ownerUser = userObj;
    }

    const existingAccount = await prisma.account.findFirst({
      where: { userId: userObj.id, providerId: 'credential' },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          hashId: getUniqueHashId(),
          userId: userObj.id,
          accountId: userObj.id,
          providerId: 'credential',
          password: defaultPasswordHash,
        },
      });
    }
  }

  // 2. Seed Cities
  console.log('Seeding cities...');
  for (const city of defaultCities) {
    await prisma.city.upsert({
      where: {
        name_state_country: {
          name: city.name,
          state: city.state,
          country: city.country,
        },
      },
      update: {},
      create: {
        ...city,
        hashId: getUniqueHashId(),
      },
    });
  }

  // 3. Seed Amenities
  console.log('Seeding amenities...');
  const createdAmenities = [];
  for (const amenity of defaultAmenities) {
    const a = await prisma.amenity.upsert({
      where: { name: amenity.name },
      update: {},
      create: {
        ...amenity,
        hashId: getUniqueHashId(),
      },
    });
    createdAmenities.push(a);
  }

  // 4. Seed Banners
  console.log('Seeding banners...');
  for (let i = 0; i < demoBanners.length; i++) {
    const b = demoBanners[i];
    const existing = await prisma.banner.findFirst({ where: { title: b.title } });
    if (!existing) {
      await prisma.banner.create({
        data: {
          hashId: getUniqueHashId(),
          title: b.title,
          description: b.description,
          imageUrl: b.imageUrl,
          linkUrl: b.linkUrl,
          isActive: true,
          sortOrder: i,
        },
      });
    }
  }

  // 5. Seed Facilities & Courts from demoVenues
  console.log('Seeding facilities and courts...');
  const today = new Date();

  for (const venue of demoVenues) {
    let facility = await prisma.facility.findFirst({
      where: { name: venue.name, city: venue.city },
    });

    if (!facility) {
      facility = await prisma.facility.create({
        data: {
          hashId: getUniqueHashId(),
          ownerId: ownerUser.id,
          name: venue.name,
          description: venue.description,
          address: `${venue.name} Complex, Main Road`,
          city: venue.city,
          state: venue.state,
          country: 'India',
          pincode: '380001',
          phone: '+91 9876543210',
          email: `contact@${venue.id}.com`,
          status: FacilityStatus.APPROVED,
          venueType: venue.venueType as VenueType,
          rating: venue.rating,
          totalReviews: venue.totalReviews,
          isActive: true,
          approvedAt: new Date(),
        },
      });

      // Photos
      if (venue.photos && venue.photos.length > 0) {
        for (let idx = 0; idx < venue.photos.length; idx++) {
          const p = venue.photos[idx];
          await prisma.facilityPhoto.create({
            data: {
              hashId: getUniqueHashId(),
              facilityId: facility.id,
              url: p.url,
              caption: p.caption || venue.name,
              isPrimary: idx === 0,
              sortOrder: idx,
            },
          });
        }
      }

      // Facility Amenities
      for (const a of createdAmenities.slice(0, 4)) {
        try {
          await prisma.facilityAmenity.create({
            data: {
              hashId: getUniqueHashId(),
              facilityId: facility.id,
              amenityId: a.id,
            },
          });
        } catch {
          // ignore duplicate amenity link if any
        }
      }

      // Operating Hours (Mon-Sun)
      for (let day = 0; day < 7; day++) {
        try {
          await prisma.operatingHour.create({
            data: {
              hashId: getUniqueHashId(),
              facilityId: facility.id,
              dayOfWeek: day,
              openTime: '06:00',
              closeTime: '22:00',
              isClosed: false,
            },
          });
        } catch {
          // ignore duplicate operating hour if any
        }
      }

      // Courts & Time Slots
      for (let cIdx = 0; cIdx < venue.courts.length; cIdx++) {
        const courtData = venue.courts[cIdx];
        const court = await prisma.court.create({
          data: {
            hashId: getUniqueHashId(),
            facilityId: facility.id,
            name: `${courtData.sportType} Court ${cIdx + 1}`,
            sportType: courtData.sportType as SportType,
            pricePerHour: courtData.pricePerHour,
            isActive: true,
            capacity: 10,
            surface: 'Synthetic Turf / Wooden',
          },
        });

        // Add sample time slots
        for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
          const slotDate = new Date(today);
          slotDate.setDate(today.getDate() + dayOffset);
          slotDate.setHours(0, 0, 0, 0);

          for (let hour = 10; hour <= 18; hour += 4) {
            const startTime = new Date(slotDate);
            startTime.setHours(hour, 0, 0, 0);

            const endTime = new Date(slotDate);
            endTime.setHours(hour + 2, 0, 0, 0);

            try {
              await prisma.timeSlot.create({
                data: {
                  hashId: getUniqueHashId(),
                  courtId: court.id,
                  date: slotDate,
                  startTime,
                  endTime,
                  price: courtData.pricePerHour * 2,
                  isBooked: false,
                  isBlocked: false,
                },
              });
            } catch {
              // ignore duplicate slot if any
            }
          }
        }
      }
    }
  }

  console.log('✅ Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
