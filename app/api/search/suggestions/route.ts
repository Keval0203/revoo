import { NextRequest } from 'next/server';
import { getFacilitySuggestions } from '@/lib/search/elasticsearch';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const size = parseInt(searchParams.get('size') || '5');

    if (!query) {
      return Response.json({ 
        query: '',
        suggestions: [] 
      });
    }

    try {
      // Try Elasticsearch with short timeout
      const results = await Promise.race([
        getFacilitySuggestions(query, size),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('ES_TIMEOUT')), 300))
      ]);

      if (results?.success && results.suggestions?.length > 0) {
        return Response.json({
          query,
          suggestions: results.suggestions
        });
      }
    } catch {
      // Elasticsearch failed/timed out, gracefully fallback to Prisma
    }

    // Direct, ultra-fast Prisma SQLite search
    const dbFacilities = await prisma.facility.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query } },
          { city: { contains: query } },
          { state: { contains: query } },
        ]
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
      },
      take: size,
    });

    const suggestions = dbFacilities.map(f => ({
      type: 'facility' as const,
      id: f.id,
      name: f.name,
      subtitle: `${f.city}, ${f.state}`,
      text: f.name,
    }));

    return Response.json({
      query,
      suggestions,
    });

  } catch (error) {
    return Response.json({
      query: '',
      suggestions: [],
    });
  }
}