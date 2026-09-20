import { NextRequest } from 'next/server';
import { searchDocuments } from '@/lib/search/elasticsearch';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const size = parseInt(searchParams.get('size') || '10');
    const from = parseInt(searchParams.get('from') || '0');
    const category = searchParams.get('category') || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;

    if (!query) {
      return Response.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    try {
      const results = await Promise.race([
        searchDocuments(query, { size, from, category, tags }),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('ES_TIMEOUT')), 400))
      ]);

      if (results?.success) {
        return Response.json({
          query,
          results: results.results,
          total: results.total,
          took: results.took,
          pagination: {
            current_page: Math.floor(from / size) + 1,
            per_page: size,
            total_pages: Math.ceil(((results.total as any)?.value || 0) / size)
          }
        });
      }
    } catch {
      // Elasticsearch fallback to Prisma
    }

    // Direct, ultra-fast Prisma SQLite search
    const [facilities, totalCount] = await Promise.all([
      prisma.facility.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query } },
            { city: { contains: query } },
            { state: { contains: query } },
            { address: { contains: query } },
          ]
        },
        include: {
          courts: true,
          photos: true,
        },
        skip: from,
        take: size,
      }),
      prisma.facility.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query } },
            { city: { contains: query } },
            { state: { contains: query } },
            { address: { contains: query } },
          ]
        }
      })
    ]);

    return Response.json({
      query,
      results: facilities,
      total: { value: totalCount },
      took: 1,
      pagination: {
        current_page: Math.floor(from / size) + 1,
        per_page: size,
        total_pages: Math.ceil(totalCount / size)
      }
    });

  } catch (error) {
    return Response.json({
      query: '',
      results: [],
      total: { value: 0 },
      took: 0,
      pagination: { current_page: 1, per_page: 10, total_pages: 0 }
    });
  }
}