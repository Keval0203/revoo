import type { Metadata } from "next"
import { Suspense } from "react"
import { ThemedSignupPage } from "@/components/auth/ThemedSignupPage"
import { AuthRedirect } from "@/components/auth/AuthRedirect"

export const metadata: Metadata = {
  title: "Sign Up - REVO",
  description: "Create your REVO account as a Player or Facility Owner",
}

function SignupFallback() {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <AuthRedirect>
      <Suspense fallback={<SignupFallback />}>
        <ThemedSignupPage />
      </Suspense>
    </AuthRedirect>
  )
}
