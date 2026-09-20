"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";
import { FaGoogle, FaMicrosoft } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
    }),
  confirmPassword: z.string(),
  role: z.enum(["user", "facility_owner", "admin"], { message: "Invalid role" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface SignupFormProps {
  presetRole?: "user" | "facility_owner" | "admin";
}

export function SignupForm({ presetRole = "user" }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: "",
      email: "", 
      password: "",
      confirmPassword: "",
      role: presetRole 
    },
  });

  // Sync role if parent tab changes
  useEffect(() => {
    form.setValue("role", presetRole);
  }, [presetRole, form]);

  const handleCredentialsSignup = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // 1. Create the account via better-auth
      const { data: signupData, error: signupError } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (signupError) {
        toast.error("Registration Failed", { description: signupError.message });
        return;
      }

      // 2. Update role if not user
      if (values.role && values.role !== 'user') {
        try {
          await fetch('/api/auth/update-role', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: values.role }),
          });
        } catch {
          // silently continue
        }
      }

      toast.success("Account Created Successfully! 🎉", {
        description: `Welcome to REVO, ${values.name}! Redirecting...`,
      });

      // 3. Determine redirect URL based on selected role
      let destination = '/';
      if (values.role === 'admin') {
        destination = '/admin';
      } else if (values.role === 'facility_owner') {
        destination = '/owner';
      } else if (returnUrl && returnUrl !== '/' && returnUrl !== '/signup') {
        destination = returnUrl;
      }

      setTimeout(() => {
        router.push(destination);
      }, 300);
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: returnUrl,
        errorCallbackURL: "/error",
        newUserCallbackURL: "/onboard",
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      toast.error("Error Signing Up With Google", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMicrosoftSignup = async () => {
    setMicrosoftLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: returnUrl,
        errorCallbackURL: "/error",
        newUserCallbackURL: "/onboard",
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      toast.error("Error Signing Up With Microsoft", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setMicrosoftLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleCredentialsSignup)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John Doe" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="name@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="••••••••" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="••••••••" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Player/Customer</span>
                          <span className="text-sm text-muted-foreground">Book and play at facilities</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="facility_owner">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Facility Owner</span>
                          <span className="text-sm text-muted-foreground">Manage your sports facilities</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Administrator</span>
                          <span className="text-sm text-muted-foreground">Full platform & moderation control</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>

      <Separator />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Button
          variant="outline"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="flex items-center gap-2"
        >
          {googleLoading ? (
            <>
              <Loader className="h-4 w-4" />
              Connecting...
            </>
          ) : (
            <>
              <FaGoogle />
              Google
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleMicrosoftSignup}
          disabled={microsoftLoading}
          className="flex items-center gap-2"
        >
          {microsoftLoading ? (
            <>
              <Loader className="h-4 w-4" />
              Connecting...
            </>
          ) : (
            <>
              <FaMicrosoft />
              Microsoft
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
