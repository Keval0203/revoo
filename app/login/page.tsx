import type { Metadata } from "next"
import { Suspense } from "react"
import { ThemedLoginPage } from "@/components/auth/ThemedLoginPage"
import { AuthRedirect } from "@/components/auth/AuthRedirect"

export const metadata: Metadata = {
  title: "Login - REVO",
  description: "Login to your REVO account as Player, Facility Owner or Admin",
}

function LoginFallback() {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthRedirect>
      <Suspense fallback={<LoginFallback />}>
        <ThemedLoginPage />
      </Suspense>
    </AuthRedirect>
  )
}
