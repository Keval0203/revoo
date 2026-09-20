"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  BookOpen,
  Users,
  BarChart3,
  DollarSign,
  Wrench,
  Home,
  LogOut,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const navigation = [
  {
    name: "Dashboard",
    href: "/owner",
    icon: LayoutDashboard,
  },
  {
    name: "Facilities",
    href: "/owner/facilities",
    icon: Building2,
  },
  {
    name: "Courts",
    href: "/owner/courts",
    icon: Home,
  },
  {
    name: "Bookings",
    href: "/owner/bookings",
    icon: Calendar,
  },
  {
    name: "Schedule",
    href: "/owner/schedule",
    icon: BookOpen,
  },
  {
    name: "Customers",
    href: "/owner/customers",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/owner/analytics",
    icon: BarChart3,
  },
  {
    name: "Revenue",
    href: "/owner/revenue",
    icon: DollarSign,
  },
  {
    name: "Maintenance",
    href: "/owner/maintenance",
    icon: Wrench,
  },
];

export function OwnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      toast.success("Logged out successfully");
      window.location.href = "/";
    }
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-card border-r border-gray-200 dark:border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Owner Portal</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-muted/50"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer with Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-border space-y-2">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 text-red-500" />
          {!collapsed && <span>Log out</span>}
        </button>
        {!collapsed && (
          <div className="text-[11px] text-gray-400 dark:text-gray-500 text-center pt-1">
            REVO Sports Platform
          </div>
        )}
      </div>
    </div>
  );
}
