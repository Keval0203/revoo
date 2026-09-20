"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Shield, User2, Building2, Crown, Sparkles, Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoleKey = "user" | "facility_owner" | "admin";

const rolePanels: Record<RoleKey, {
  key: RoleKey;
  title: string;
  description: string;
  icon: any;
  accent: string;
  badge: string;
  features: string[];
  demo: string;
  demoPass: string;
}> = {
  user: {
    key: "user",
    title: "Player",
    description: "Book courts, view schedules, manage bookings",
    icon: User2,
    accent: "from-emerald-500 to-green-600",
    badge: "Most Popular",
    features: [
      "Instant venue booking",
      "Booking history & receipts",
      "Favourite venues list",
      "Coupons & offers",
    ],
    demo: "player@revo.in",
    demoPass: "Demo@1234",
  },
  facility_owner: {
    key: "facility_owner",
    title: "Facility Owner",
    description: "Manage venues, courts, revenue & customers",
    icon: Building2,
    accent: "from-sky-500 to-indigo-600",
    badge: "For Business",
    features: [
      "Unlimited facility listings",
      "Court & schedule management",
      "Revenue & payout dashboard",
      "Customer bookings & support",
    ],
    demo: "owner@revo.in",
    demoPass: "Demo@1234",
  },
  admin: {
    key: "admin",
    title: "Administrator",
    description: "Full platform control & moderation",
    icon: Crown,
    accent: "from-amber-500 to-orange-600",
    badge: "Super Admin",
    features: [
      "User & role management",
      "Facility approvals",
      "Payments, reports & analytics",
      "Coupons, tickets & settings",
    ],
    demo: "admin@revo.in",
    demoPass: "Demo@1234",
  },
};

const roleFromParam = (param: string | null): RoleKey => {
  if (!param) return "user";
  const p = param.toLowerCase().trim();
  if (p === "admin") return "admin";
  if (p === "owner" || p === "facility_owner" || p === "facility-owner" || p === "faculity") return "facility_owner";
  return "user";
};

export function ThemedLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [demoHint, setDemoHint] = useState(false);
  const [quickLoginEmail, setQuickLoginEmail] = useState<string | undefined>(undefined);
  const [quickLoginPass, setQuickLoginPass] = useState<string | undefined>(undefined);
  const returnUrl = searchParams.get('returnUrl') || undefined;

  const roleParam = searchParams.get("role");
  const roleKey: RoleKey = roleFromParam(roleParam);
  const role = rolePanels[roleKey];
  const Icon = role.icon;

  const signupRole = roleKey === "admin" ? "facility_owner" : roleKey;

  const buildSignupUrl = () => {
    const params = new URLSearchParams();
    params.set("role", signupRole === "facility_owner" ? "facility-owner" : signupRole);
    if (returnUrl) params.set("returnUrl", returnUrl);
    return `/signup?${params.toString()}`;
  };

  const buildSwitchUrl = (r: RoleKey) => {
    const params = new URLSearchParams();
    params.set("role", r === "facility_owner" ? "facility-owner" : r);
    if (returnUrl) params.set("returnUrl", returnUrl);
    return `/login?${params.toString()}`;
  };

  const [selectedRole, setSelectedRole] = useState<RoleKey>(roleKey);
  useEffect(() => {
    setSelectedRole(roleKey);
  }, [roleKey]);
  const activeRole = rolePanels[selectedRole];
  const ActiveIcon = activeRole.icon;

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
            Welcome to REVO — {selectedRole === "admin" ? "Admin Console" : selectedRole === "facility_owner" ? "Partner Portal" : "Sign in"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-muted-foreground text-base">
            Secure access to your <span className="font-medium">{activeRole.title.toLowerCase()}</span> panel.
          </p>
        </div>

        {/* Role Switcher Pills */}
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
                  asChild={!isActive}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-medium transition-all",
                    isActive ? cn("bg-gradient-to-r text-white shadow-md", rmeta.accent) : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => isActive ? undefined : router.push(buildSwitchUrl(r))}
                >
                  {isActive ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <RIcon className="w-3.5 h-3.5" />
                      {rmeta.title}
                    </span>
                  ) : (
                    <a
                      href={buildSwitchUrl(r)}
                      className="flex items-center justify-center gap-1.5 w-full h-full"
                      onClick={(e) => { e.preventDefault(); router.push(buildSwitchUrl(r)); }}
                    >
                      <RIcon className="w-3.5 h-3.5" />
                      {rmeta.title}
                    </a>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-[460px]">
          {/* Role Banner */}
          <div className={cn(
            "rounded-2xl p-6 mb-6 bg-gradient-to-br text-white relative overflow-hidden shadow-lg",
            activeRole.accent
          )}>
            {/* decorative */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -right-20 -bottom-20 w-56 h-56 rounded-full bg-white/5" />

            <div className="relative flex items-start justify-between">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm mb-3">
                  <ActiveIcon className="w-6 h-6" />
                </div>
                <p className="text-xs uppercase tracking-widest opacity-80 font-semibold mb-1">
                  Signing in as
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

            {/* Feature bullets + quick demo info */}
            <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
              {activeRole.features.slice(0, 4).map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-white/95">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42L8 12.58l7.29-7.29a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {demoHint && (
              <div className="relative mt-5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 p-3 text-xs">
                <p className="font-semibold mb-1">🎯 Demo credentials (pre-seeded)</p>
                <div className="flex items-center gap-2 opacity-95 mb-2">
                  <Lock className="w-3 h-3 flex-shrink-0" />
                  <div>
                    <p>Email: <code className="font-mono bg-black/20 rounded px-1.5 py-0.5">{activeRole.demo}</code></p>
                    <p>Password: <code className="font-mono bg-black/20 rounded px-1.5 py-0.5">{activeRole.demoPass}</code></p>
                  </div>
                </div>
                <button
                  className="w-full mt-1 py-1.5 rounded-lg bg-white/25 hover:bg-white/40 text-white font-semibold text-xs transition-all border border-white/30"
                  onClick={() => { setQuickLoginEmail(activeRole.demo); setQuickLoginPass(activeRole.demoPass); }}
                >
                  ⚡ Quick Login as {activeRole.title}
                </button>
              </div>
            )}
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-1">Welcome back 👋</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your credentials to access the <span className="font-medium">{activeRole.title.toLowerCase()}</span> panel.
                </p>
              </div>

              <LoginForm
                presetEmail={quickLoginEmail ?? (demoHint ? activeRole.demo : undefined)}
                presetPassword={quickLoginPass}
                roleHint={selectedRole}
                hideRoleSelection
              />
            </div>
          </div>

          {/* Quick Demo Login Buttons */}
          <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-semibold text-primary mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Quick Demo Login — one click, no password needed
            </p>
            <div className="grid grid-cols-1 gap-2">
              {(["user", "facility_owner", "admin"] as RoleKey[]).map((r) => {
                const rm = rolePanels[r];
                const RIcon = rm.icon;
                const accentMap: Record<RoleKey, string> = {
                  user: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                  facility_owner: "bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/20",
                  admin: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20",
                };
                return (
                  <button
                    key={r}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-all",
                      accentMap[r]
                    )}
                    onClick={() => {
                      router.push(buildSwitchUrl(r));
                      setQuickLoginEmail(rm.demo);
                      setQuickLoginPass(rm.demoPass);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <RIcon className="w-3.5 h-3.5" />
                      <span>{rm.title}</span>
                      <code className="opacity-60 text-[10px] font-mono">{rm.demo}</code>
                    </span>
                    <span className="opacity-60">⚡ Login</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">All demo accounts use password: <code className="font-mono">Demo@1234</code></p>
          </div>

          {/* Footer Links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <p className="text-xs text-muted-foreground">Don&apos;t have an account?</p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => router.push(buildSignupUrl())}
            >
              Sign up instead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
