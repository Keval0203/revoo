"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Loader } from "@/components/ui/loader";
import { Mail, ArrowLeft, Sparkles, KeyRound, Check } from "lucide-react";

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

interface OTPVerificationProps {
  email: string;
  mode: "signup" | "signin";
  onBack: () => void;
  onSuccess: () => void;
}

export function OTPVerification({ email, mode, onBack, onSuccess }: OTPVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [detectedOtp, setDetectedOtp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const fetchDevOtp = useCallback(async () => {
    try {
      const res = await fetch(`/api/auth/dev-otp?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.otp) {
          setDetectedOtp(data.otp);
          // If the form doesn't already have an OTP, auto-fill it!
          if (!form.getValues("otp")) {
            form.setValue("otp", data.otp);
            toast.info("Verification Code Ready", {
              description: `Code ${data.otp} detected and auto-filled!`,
            });
          }
        }
      }
    } catch {
      // Dev helper silently ignores errors
    }
  }, [email, form]);

  useEffect(() => {
    // Check for dev OTP right after mount
    fetchDevOtp();
    const interval = setInterval(fetchDevOtp, 3000);
    return () => clearInterval(interval);
  }, [fetchDevOtp]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOTPVerification = async (values: z.infer<typeof otpSchema>) => {
    setIsVerifying(true);
    try {
      if (mode === "signup") {
        const { error } = await (authClient as any).emailOtp?.verifyEmail?.({
          email,
          otp: values.otp,
        }) || {};

        if (error) {
          toast.error("Verification Failed", { description: error.message });
          return;
        }

        toast.success("Email Verified Successfully", {
          description: "Your account has been activated. You can now sign in.",
        });
      } else {
        const { error } = await (authClient as any).signIn?.emailOtp?.({
          email,
          otp: values.otp,
        }) || {};

        if (error) {
          toast.error("Sign In Failed", { description: error.message });
          return;
        }

        toast.success("Signed In Successfully", {
          description: "Welcome back!",
        });
      }

      onSuccess();
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const { error } = await (authClient as any).emailOtp?.sendVerificationOtp?.({
        email,
        type: mode === "signup" ? "email-verification" : "sign-in",
      }) || {};

      if (error) {
        toast.error("Failed to Resend OTP", { description: error.message });
        return;
      }

      toast.success("OTP Sent", {
        description: "A new verification code has been generated.",
      });
      
      setResendTimer(60);
      setCanResend(false);

      // Poll immediately for new OTP
      setTimeout(fetchDevOtp, 500);
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to resend verification code.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Enter Verification Code
        </h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a 6-digit verification code for{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {/* Dev OTP Helper Box */}
      {detectedOtp && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-center space-y-2 animate-in fade-in duration-300">
          <div className="text-xs font-semibold text-primary flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dev Mode Verification Code</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xl font-bold tracking-widest bg-background/90 px-3 py-1 rounded-lg border shadow-sm">
              {detectedOtp}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs font-medium gap-1.5"
              onClick={() => {
                form.setValue("otp", detectedOtp);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast.success("OTP filled into input!");
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <KeyRound className="w-3.5 h-3.5" />}
              {copied ? "Filled" : "Auto-Fill"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Since local email is bypassed, your code is available right here.
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleOTPVerification)} className="space-y-6">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-center block">Verification Code</FormLabel>
                <FormControl>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                Verifying...
              </>
            ) : (
              `Verify ${mode === "signup" ? "Email" : "& Sign In"}`
            )}
          </Button>
        </form>
      </Form>

      <div className="space-y-4 text-center">
        <div className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          {canResend ? (
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={handleResendOTP}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader className="mr-1 h-3 w-3" />
                  Sending...
                </>
              ) : (
                "Resend code"
              )}
            </Button>
          ) : (
            <span>Resend in {resendTimer}s</span>
          )}
        </div>

        <Button variant="ghost" onClick={onBack} className="text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {mode === "signup" ? "sign up" : "sign in"}
        </Button>
      </div>
    </div>
  );
}
