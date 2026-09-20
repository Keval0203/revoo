"use client";

import { usePopularSports } from '@/hooks/swr/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSportType, formatCurrency } from '@/lib/utils';

// Sport type to icon mapping
const sportIcons: Record<string, string> = {
  BADMINTON: '🏸',
  TENNIS: '🎾',
  FOOTBALL: '⚽',
  BASKETBALL: '🏀',
  CRICKET: '🏏',
  SQUASH: '🎾',
  TABLE_TENNIS: '🏓',
  VOLLEYBALL: '🏐',
  SWIMMING: '🏊',
  GYM: '💪',
  OTHER: '🏃',
};

export function PopularSports() {
  const { sports, isLoading, error } = usePopularSports();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || sports.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No sports data found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Popular Sports</h2>
        <Link href="/sports">
          <Button variant="outline" className="border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800">View All</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sports.map((sport) => (
          <Card key={sport.sportType} className="hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">
                  {sportIcons[sport.sportType] || sportIcons.OTHER}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {formatSportType(sport.sportType)}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{sport.venueCount} venues</span>
                    <Badge variant="secondary" className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50">
                      Avg ₹{sport.averagePrice}/hr
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Top Venues:
                </h4>
                {sport.facilities.slice(0, 2).map((facility) => (
                  <Link
                    key={facility.id}
                    href={`/venues/${facility.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors">
                      {facility.photos[0] ? (
                        <img
                          src={facility.photos[0].url}
                          alt={facility.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
                          <span className="text-2xl">
                            {sportIcons[sport.sportType] || sportIcons.OTHER}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1 text-gray-900 dark:text-white">
                          {facility.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>{facility.city}</span>
                          {facility.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-gray-900 dark:text-gray-200">{facility.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {sport.facilities.length > 2 && (
                  <Link href={`/search?sport=${sport.sportType}`}>
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                      +{sport.facilities.length - 2} more venues
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
