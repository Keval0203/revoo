"use client";

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useState, useEffect } from 'react';

export function useAuthRedirect() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: session } = await authClient.getSession();
      setIsAuthenticated(!!session?.user);
    };
    checkSession();
  }, []);

  const redirectToLogin = (returnUrl?: string) => {
    const currentUrl = returnUrl || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
    const loginUrl = `/login?returnUrl=${encodeURIComponent(currentUrl)}`;
    router.push(loginUrl);
  };

  const checkIsAuthenticated = async (): Promise<boolean> => {
    const { data: session } = await authClient.getSession();
    const authenticated = !!session?.user;
    setIsAuthenticated(authenticated);
    return authenticated;
  };

  const requireAuth = async (action: () => void | Promise<void>, returnUrl?: string): Promise<boolean> => {
    const authenticated = await checkIsAuthenticated();
    if (!authenticated) {
      redirectToLogin(returnUrl);
      return false;
    }
    try {
      await action();
      return true;
    } catch (error) {
      console.error('Action failed:', error);
      return false;
    }
  };

  const checkAuthForBooking = async (venueId: number | string, returnUrl?: string): Promise<boolean> => {
    const bookingUrl = returnUrl || `/venues/${venueId}/book`;
    return requireAuth(() => {
      router.push(bookingUrl);
    }, bookingUrl);
  };

  return {
    redirectToLogin,
    requireAuth,
    checkAuthForBooking,
    isAuthenticated,
    checkIsAuthenticated,
  };
}
