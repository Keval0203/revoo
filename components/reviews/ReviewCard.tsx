import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import { VenueReview } from '@/hooks/swr/reviews';
import { formatSportType } from '@/lib/utils';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { Verified } from 'lucide-react';

interface ReviewCardProps {
  review: VenueReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const reviewDate = new Date(review.createdAt);
  const bookingDate = new Date(review.bookingDate);

  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    const daysAgo = differenceInDays(new Date(), date);
    if (daysAgo < 7) {
      return `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
    }
    return format(date, 'MMM d, yyyy');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="border border-gray-200 dark:border-border rounded-lg p-6 space-y-4">
      {/* User Info and Rating */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.userAvatar} alt={review.userName} />
            <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              {getUserInitials(review.userName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">{review.userName}</h4>
              {review.isVerified && (
                <Verified className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(reviewDate)}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{review.rating}.0</div>
        </div>
      </div>

      {/* Review Content */}
      {review.comment && (
        <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {review.comment}
        </div>
      )}

      {/* Booking Context */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-border">
        <span className="text-sm text-gray-500 dark:text-gray-400">Played</span>
        {review.sportType && (
          <Badge variant="secondary" className="text-xs">
            {formatSportType(review.sportType)}
          </Badge>
        )}
        {review.courtName && (
          <span className="text-sm text-gray-500 dark:text-gray-400">at {review.courtName}</span>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {format(bookingDate, 'MMM d, yyyy')}
        </span>
      </div>
    </div>
  );
}
