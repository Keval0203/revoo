import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prismaClient';
import { demoVenues } from '@/lib/demo-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;
  
  try {
    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: `/api/venues/${id}`,
        venueId: id,
      },
      message: 'Fetching venue details.',
    });

    if (!id) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL?.trim()) {
      const demoVenue = demoVenues.find((item) => item.id === id);
      if (!demoVenue) {
        return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
      }

      return NextResponse.json({
        venue: {
          ...demoVenue,
          address: `Demo Sports Complex, ${demoVenue.city}`,
          country: 'India',
          pincode: '400001',
          latitude: null,
          longitude: null,
          phone: '+91 98765 43210',
          email: 'hello@revo.in',
          website: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          courts: demoVenue.courts.map((court, index) => ({
            id: `${demoVenue.id}-court-${index + 1}`,
            name: `${court.sportType.replace('_', ' ')} Court ${index + 1}`,
            ...court,
            isActive: true,
            description: `Well-maintained ${court.sportType.toLowerCase()} court`,
            capacity: 8,
            length: null,
            width: null,
          })),
          photos: demoVenue.photos.map((photo, index) => ({
            id: `${demoVenue.id}-photo-${index + 1}`,
            ...photo,
            isPrimary: index === 0,
          })),
          amenities: [],
          operatingHours: [],
        },
      });
    }

    // Fetch venue details by id (string cuid)
    const venue = await prisma.facility.findUnique({
      where: {
        id: id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
        latitude: true,
        longitude: true,
        phone: true,
        email: true,
        website: true,
        venueType: true,
        rating: true,
        totalReviews: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        courts: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            sportType: true,
            pricePerHour: true,
            isActive: true,
            description: true,
            capacity: true,
            length: true,
            width: true,
          },
        },
        amenities: {
          select: {
            id: true,
            amenity: {
              select: {
                id: true,
                name: true,
                icon: true,
                description: true,
              },
            },
          },
        },
        photos: {
          select: {
            id: true,
            url: true,
            caption: true,
            isPrimary: true,
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ],
        },
        operatingHours: {
          select: {
            dayOfWeek: true,
            openTime: true,
            closeTime: true,
            isClosed: true,
          },
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    if (!venue) {
      globalThis?.logger?.warn({
        meta: {
          requestId,
          endpoint: `/api/venues/${id}`,
          venueId: id,
        },
        message: 'Venue not found.',
      });

      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Transform the amenities data to match the expected format
    const transformedVenue = {
      ...venue,
      amenities: venue.amenities.map(facilityAmenity => ({
        id: facilityAmenity.amenity.id,
        name: facilityAmenity.amenity.name,
        icon: facilityAmenity.amenity.icon,
        category: facilityAmenity.amenity.description, // Using description as category
      })),
    };

    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: `/api/venues/${id}`,
        venueId: id,
        venueFound: true,
        courtsCount: venue.courts.length,
        photosCount: venue.photos.length,
      },
      message: 'Venue details fetched successfully.',
    });

    return NextResponse.json({
      venue: transformedVenue,
    });

  } catch (error) {
    console.error('Venue details API Error:', error);
    
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: `/api/venues/${id}`,
        venueId: id,
      },
      message: 'Failed to fetch venue details.',
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
