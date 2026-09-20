"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Settings,
  BarChart3,
  Shield,
  HelpCircle,
  MessageSquare,
  Trophy,
  CreditCard,
  FileText,
  MapPin,
  Tag,
  Mail,
  ChevronDown,
  ChevronRight,
  Home,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "User Management",
    icon: Users,
    items: [
      { title: "All Users", href: "/admin/users" },
    ],
  },
  {
    title: "Facility Management",
    icon: Building2,
    items: [
      { title: "All Facilities", href: "/admin/facilities" },
      { title: "Pending Approvals", href: "/admin/facilities/pending" },
    ],
  },
  {
    title: "Court Management",
    icon: Home,
    items: [
      { title: "All Courts", href: "/admin/courts" },
      { title: "Court Analytics", href: "/admin/courts/analytics" },
    ],
  },
  {
    title: "Booking Management",
    icon: Calendar,
    items: [
      { title: "All Bookings", href: "/admin/bookings" },
    ],
  },
  {
    title: "Financial Management",
    icon: CreditCard,
    items: [
      { title: "Payments", href: "/admin/payments" },
    
      { title: "Coupons", href: "/admin/coupons" },
    ],
  },
  {
    title: "Reports & Moderation",
    icon: Shield,
    items: [
      { title: "User Reports", href: "/admin/reports" },
    ],
  },
  {
    title: "Support & Help",
    icon: HelpCircle,
    items: [
      { title: "Support Tickets", href: "/admin/support" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]);

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

  const toggleItem = (title: string) => {
    setOpenItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActiveItem = (item: any) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const isActiveParent = (items: any[]) => {
    return items.some(item => isActiveItem(item));
  };

  return (
    <div className="w-64 bg-white dark:bg-card shadow-sm border-r border-gray-200 dark:border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-border">
        <Link href="/admin" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">Admin Portal</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          if (item.items) {
            const isOpen = openItems.includes(item.title);
            const isActive = isActiveParent(item.items);

            return (
              <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleItem(item.title)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between text-left font-medium px-3 py-2.5 h-auto",
                      isActive && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 ml-4 mt-1">
                  {item.items.map((subItem) => (
                    <Link key={subItem.href} href={subItem.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left font-normal px-3 py-2 h-auto",
                          isActiveItem(subItem) && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                        )}
                      >
                        {subItem.title}
                      </Button>
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left font-medium px-3 py-2.5 h-auto",
                  isActiveItem(item) && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>
      {/* Footer with Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 text-red-500" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
