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

const formSchema = z.object({
  email: z.email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type FormData = z.infer<typeof formSchema>;

interface LoginFormProps {
  presetEmail?: string;
  presetPassword?: string;
  roleHint?: "user" | "facility_owner" | "admin";
  hideRoleSelection?: boolean;
}

export function LoginForm({ presetEmail, presetPassword, roleHint, hideRoleSelection }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: presetEmail || "",
      password: presetPassword || "",
    },
  });

  // Watch for changes to preset credentials and auto-fill / submit
  useEffect(() => {
    if (presetEmail) {
      form.setValue('email', presetEmail);
    }
    if (presetPassword) {
      form.setValue('password', presetPassword);
    }
    if (presetEmail && presetPassword) {
      const timer = setTimeout(() => {
        form.handleSubmit(handleCredentialsLogin)();
      }, 100);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetEmail, presetPassword]);

  const handleCredentialsLogin = async (values: FormData) => {
    setIsLoading(true);
    try {
      const { data: signInData, error } = await authClient.signIn.email(
        {
          email: values.email,
          password: values.password,
        },
        {
          onSuccess: (ctx) => {
            const userRole = ctx.data.user?.role;
            let redirectUrl = returnUrl;

            if (userRole === 'admin') {
              redirectUrl = '/admin';
            } else if (userRole === 'facility_owner') {
              redirectUrl = '/owner';
            } else if (returnUrl === '/login' || returnUrl === '/') {
              redirectUrl = '/';
            }

            toast.success("Signed in successfully! 👋");
            router.push(redirectUrl);
          },
          onError: (ctx) => {
            toast.error("Login Failed", {
              description: ctx.error.message || "Invalid email or password.",
            });
          }
        }
      );

      if (error) {
        toast.error("Login Failed", { description: error.message });
      }
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during login.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
      toast.error("Error Logging In With Google", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
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
      toast.error("Error Logging In With Microsoft", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setMicrosoftLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleCredentialsLogin)}
          className="space-y-4"
        >
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>

      <Separator />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Button
          variant="outline"
          onClick={handleGoogleLogin}
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
          onClick={handleMicrosoftLogin}
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
