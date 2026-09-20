"use client";

import { useDashboardBanners } from '@/hooks/swr/dashboard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles, ShieldCheck, Zap, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';

export function WelcomeBanner() {
  const { data: sessionData, isPending: isLoadingUser } = authClient.useSession();
  const user = sessionData?.user;
  const { banners, isLoading, error } = useDashboardBanners();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance carousel every 6s
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (isLoading) {
    return (
      <div className="relative h-[420px] md:h-[500px] overflow-hidden rounded-2xl">
        <Skeleton className="w-full h-full rounded-2xl" />
      </div>
    );
  }

  // Active banner data or fallback
  const fallbackBanner = {
    id: 'default-hero',
    title: 'Your next match starts here',
    description: 'Reserve premium courts in just a few clicks. Badminton, tennis, cricket, football — all in one place.',
    imageUrl: '/hero-bg.jpg',
    linkUrl: '/search',
  };

  const currentBanner = (banners && banners.length > 0) ? banners[currentIndex] : fallbackBanner;
  const isMatchHero = currentBanner.title?.toLowerCase().includes('match') || currentBanner.title?.toLowerCase().includes('starts here');
  const bgImage = currentBanner.imageUrl || '/hero-bg.jpg';

  return (
    <div className="relative h-[420px] md:h-[500px] overflow-hidden rounded-2xl group shadow-2xl border border-slate-800/60">
      {/* Background Image with subtle scale on hover */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105"
        style={{ 
          backgroundImage: `url(${bgImage})`,
        }}
        aria-hidden="true"
      />

      {/* Cinematic Dark Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-900/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

      {/* Ambient decorative glowing particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-sky-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="px-6 sm:px-10 md:px-14 lg:px-16 max-w-3xl">
          {/* Tag / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-5 shadow-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>500+ Premium Sports Courts Across Gujarat & India</span>
          </div>

          {/* Heading */}
          {isMatchHero ? (
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight drop-shadow-md">
              Your next match
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                starts here
              </span>
            </h1>
          ) : (
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight drop-shadow-md">
              {currentBanner.title}
            </h1>
          )}

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-slate-200/90 mb-7 max-w-xl leading-relaxed drop-shadow-sm font-normal">
            {currentBanner.description || 'Reserve premium courts in just a few clicks. Badminton, tennis, cricket, football — all in one place.'}
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5">
            <Link href="/venues">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-bold px-7 h-12 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-[1.02]"
              >
                Explore Venues
              </Button>
            </Link>
            {user ? (
              <Link href="/bookings">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white/25 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 font-semibold px-6 h-12 rounded-xl transition-all duration-300"
                >
                  My Bookings
                </Button>
              </Link>
            ) : !isLoadingUser ? (
              <Link href="/login?role=user">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white/25 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 font-semibold px-6 h-12 rounded-xl transition-all duration-300"
                >
                  Sign In
                </Button>
              </Link>
            ) : null}
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center gap-6 mt-8 text-white/70 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>4.8 Avg Rating</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Instant Booking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows (Only if multiple banners) */}
      {banners && banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md transition-all duration-200 h-11 w-11 rounded-full z-20"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md transition-all duration-200 h-11 w-11 rounded-full z-20"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2.5 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`h-2.5 rounded-full transition-all duration-300 border border-white/40 ${
                  index === currentIndex 
                    ? 'w-8 bg-white shadow-lg' 
                    : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
