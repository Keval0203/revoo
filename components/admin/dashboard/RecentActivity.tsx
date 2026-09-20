"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRecentActivity } from "@/hooks/swr/admin/useRecentActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity() {
  const { data: activities, isLoading, error } = useRecentActivity();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            Failed to load recent activity
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "USER_REGISTRATION":
        return "👤";
      case "FACILITY_REGISTRATION":
        return "🏢";
      case "BOOKING_CREATED":
        return "📅";
      case "PAYMENT_COMPLETED":
        return "💳";
      case "REVIEW_SUBMITTED":
        return "⭐";
      default:
        return "📋";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "USER_REGISTRATION":
        return "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300";
      case "FACILITY_REGISTRATION":
        return "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300";
      case "BOOKING_CREATED":
        return "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300";
      case "PAYMENT_COMPLETED":
        return "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300";
      case "REVIEW_SUBMITTED":
        return "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities && activities.length > 0 ? (
          activities.map((activity: any) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center text-sm">
                  {getActivityIcon(activity.action)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.description}
                  </p>
                  <Badge className={getActivityColor(activity.action)}>
                    {activity.action.replace("_", " ").toLowerCase()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent activity found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
