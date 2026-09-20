"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { Shield, User2, Building2, Crown, Sparkles, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoleKey = "user" | "facility_owner" | "admin";

interface RoleConfig {
  key: RoleKey;
  title: string;
  description: string;
  icon: any;
  accent: string;
  badge: string;
  features: string[];
}

const rolePanels: Record<RoleKey, RoleConfig> = {
  user: {
    key: "user",
    title: "Player",
    description: "Create your personal account to book sports venues",
    icon: User2,
    accent: "from-emerald-500 to-green-600",
    badge: "Get Started",
    features: [
      "Book venues instantly",
      "Track booking history",
      "Favourite venues & offers",
      "Referral rewards",
    ],
  },
  facility_owner: {
    key: "facility_owner",
    title: "Facility Owner",
    description: "List your sports facility and start earning",
    icon: Building2,
    accent: "from-sky-500 to-indigo-600",
    badge: "For Business",
    features: [
      "List unlimited venues & courts",
      "Manage bookings & schedules",
      "Track revenue & payouts",
      "Business analytics dashboard",
    ],
  },
  admin: {
    key: "admin",
    title: "Administrator",
    description: "Full platform administration, facilities & system control",
    icon: Crown,
    accent: "from-amber-500 to-orange-600",
    badge: "Full Control",
    features: [
      "User & role management",
      "Facility approvals & verification",
      "Revenue payouts & financial metrics",
      "Platform configuration & audit logs",
    ],
  },
};

const roleFromParam = (param: string | null): RoleKey => {
  if (!param) return "user";
  const p = param.toLowerCase().trim();
  if (p === "admin") return "admin";
  if (p === "owner" || p === "facility_owner" || p === "facility-owner" || p === "faculity") return "facility_owner";
  return "user";
};

export function ThemedSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || undefined;

  const roleParam = searchParams.get("role");
  const roleKey: RoleKey = roleFromParam(roleParam);

  const [selectedRole, setSelectedRole] = useState<RoleKey>(roleKey);
  useEffect(() => {
    setSelectedRole(roleKey);
  }, [roleKey]);

  const activeRole = rolePanels[selectedRole] || rolePanels.user;
  const ActiveIcon = activeRole.icon;

  const buildLoginUrl = (r: RoleKey) => {
    const params = new URLSearchParams();
    params.set("role", r === "facility_owner" ? "facility-owner" : r);
    if (returnUrl) params.set("returnUrl", returnUrl);
    return `/login?${params.toString()}`;
  };

  const buildSwitchUrl = (r: RoleKey) => {
    const params = new URLSearchParams();
    params.set("role", r === "facility_owner" ? "facility-owner" : r);
    if (returnUrl) params.set("returnUrl", returnUrl);
    return `/signup?${params.toString()}`;
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Top Bar */}
      <div className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Shield className="w-5 h-5 text-primary" />
          <span>REVO</span>
          <span className="text-xs text-muted-foreground font-normal">Sports Facility Platform</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>Trusted by 500+ venues across India</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pb-16 pt-2">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="w-3 h-3" />
            Join REVO — {activeRole.title} Account
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Create your REVO account
          </h1>
          <p className="text-muted-foreground text-base">
            Pick your role below to get customized access to the REVO sports platform.
          </p>
        </div>

        {/* Role Switcher Pills - ALL UNLOCKED */}
        <div className="w-full max-w-[460px] mb-6">
          <div className="inline-flex w-full rounded-xl bg-muted p-1 text-sm">
            {(["user", "facility_owner", "admin"] as RoleKey[]).map((r) => {
              const isActive = selectedRole === r;
              const rmeta = rolePanels[r];
              const RIcon = rmeta.icon;
              return (
                <Button
                  key={r}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-medium transition-all",
                    isActive
                      ? cn("bg-gradient-to-r text-white shadow-md", rmeta.accent)
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => (!isActive ? router.push(buildSwitchUrl(r)) : undefined)}
                >
                  <span className="flex items-center justify-center gap-1.5 w-full">
                    <RIcon className="w-3.5 h-3.5" />
                    {rmeta.title}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-[460px]">
          {/* Role Banner */}
          <div
            className={cn(
              "rounded-2xl p-6 mb-6 bg-gradient-to-br text-white relative overflow-hidden shadow-lg",
              activeRole.accent
            )}
          >
            {/* decorative circles */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative flex items-start justify-between">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm mb-3">
                  <ActiveIcon className="w-6 h-6" />
                </div>
                <p className="text-xs uppercase tracking-widest opacity-80 font-semibold mb-1">
                  Creating account as
                </p>
                <h2 className="text-2xl font-bold">{activeRole.title}</h2>
                <p className="text-sm opacity-90 mt-1">{activeRole.description}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                  {activeRole.badge}
                </span>
              </div>
            </div>

            {/* Feature bullets */}
            <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
              {activeRole.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-white/95">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42L8 12.58l7.29-7.29a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {/* Quick Demo Hint */}
            <div className="relative mt-5 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="opacity-90">Have a demo account?</span>
              <button
                className="inline-flex items-center gap-1 font-semibold underline hover:no-underline"
                onClick={() => router.push(buildLoginUrl(selectedRole))}
              >
                Direct Demo Login <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-1">Let&apos;s get you started 🚀</h3>
                <p className="text-sm text-muted-foreground">
                  Create your <span className="font-medium">{activeRole.title.toLowerCase()}</span> account in under a minute.
                </p>
              </div>
              <SignupForm presetRole={selectedRole} />
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <p className="text-xs text-muted-foreground">Already have an account?</p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => router.push(buildLoginUrl(selectedRole))}
            >
              Log in instead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
