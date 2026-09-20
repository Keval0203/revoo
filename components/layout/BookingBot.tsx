"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  MapPin,
  IndianRupee,
  Star,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuthRedirect } from "@/hooks/auth/useAuthRedirect";

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  venues?: VenueSuggestion[];
  quickReplies?: string[];
}

interface VenueSuggestion {
  id: string;
  name: string;
  city: string;
  state: string;
  rating?: number;
  minPrice: number;
  sportTypes: string[];
  venueType: string;
  primaryPhoto: string | null;
}

const SPORT_KEYWORDS: Record<string, string> = {
  badminton: "BADMINTON",
  tennis: "TENNIS",
  football: "FOOTBALL",
  soccer: "FOOTBALL",
  basketball: "BASKETBALL",
  cricket: "CRICKET",
  squash: "SQUASH",
  "table tennis": "TABLE_TENNIS",
  "tt": "TABLE_TENNIS",
  volleyball: "VOLLEYBALL",
  swimming: "SWIMMING",
  gym: "GYM",
};

const CITY_KEYWORDS = [
  "ahmedabad", "surat", "vadodara", "baroda", "rajkot",
  "gandhinagar", "jamnagar", "bhavnagar", "anand",
];

function formatSport(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectIntent(text: string): { sport?: string; city?: string; wantsBook?: boolean; wantsHelp?: boolean } {
  const lower = text.toLowerCase();
  let sport: string | undefined;
  let city: string | undefined;

  for (const [kw, val] of Object.entries(SPORT_KEYWORDS)) {
    if (lower.includes(kw)) { sport = val; break; }
  }
  for (const c of CITY_KEYWORDS) {
    if (lower.includes(c)) { city = c.charAt(0).toUpperCase() + c.slice(1); break; }
  }

  const wantsBook = /book|reserve|slot|court|venue|play|want|find|show|near/i.test(text);
  const wantsHelp = /help|how|what|who|when|price|cost/i.test(text);

  return { sport, city, wantsBook, wantsHelp };
}

async function fetchVenues(sport?: string, city?: string): Promise<VenueSuggestion[]> {
  try {
    const params = new URLSearchParams({ limit: "6" });
    if (sport) params.set("sportType", sport);
    if (city) params.set("city", city);
    const res = await fetch(`/api/venues?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.venues || []).slice(0, 4);
  } catch {
    return [];
  }
}

const WELCOME: Message = {
  id: "welcome",
  role: "bot",
  text: "Hi! 👋 I'm REVO Assistant. I can help you find and book sports venues across Gujarat.\n\nWhat sport are you looking to play today?",
  quickReplies: ["🏸 Badminton", "🎾 Tennis", "⚽ Football", "🏏 Cricket", "🏀 Basketball", "🏊 Swimming"],
};

export function BookingBot() {
  const router = useRouter();
  const { checkAuthForBooking } = useAuthRedirect();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages, open]);

  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now().toString() + Math.random() }]);
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    addMessage({ role: "user", text: trimmed });
    setInput("");
    setLoading(true);

    const { sport, city, wantsBook, wantsHelp } = detectIntent(trimmed);

    // Small delay for realism
    await new Promise((r) => setTimeout(r, 600));

    if (wantsHelp && !sport && !city && !wantsBook) {
      addMessage({
        role: "bot",
        text: "I can help you:\n• Find sports venues in Gujarat cities\n• Show available time slots\n• Navigate to booking pages\n\nJust tell me what sport you want to play or which city you're in!",
        quickReplies: ["Find badminton courts", "Show venues in Surat", "Cricket in Ahmedabad"],
      });
      setLoading(false);
      return;
    }

    if (!sport && !city && !wantsBook) {
      addMessage({
        role: "bot",
        text: "I didn't quite catch that. Which sport are you interested in, or which city are you looking in?",
        quickReplies: ["Badminton in Ahmedabad", "Football in Surat", "Tennis in Vadodara", "Cricket in Rajkot"],
      });
      setLoading(false);
      return;
    }

    const venues = await fetchVenues(sport, city);
    setLoading(false);

    if (venues.length === 0) {
      let responseText = "Sorry, I couldn't find any venues";
      if (sport) responseText += ` for ${formatSport(sport)}`;
      if (city) responseText += ` in ${city}`;
      responseText += ". Try a different city or sport.";

      addMessage({
        role: "bot",
        text: responseText,
        quickReplies: ["Show all venues", "Try Ahmedabad", "Try Badminton"],
      });
      return;
    }

    let responseText = `Found ${venues.length} venue${venues.length > 1 ? "s" : ""}`;
    if (sport) responseText += ` for ${formatSport(sport)}`;
    if (city) responseText += ` in ${city}`;
    responseText += "! Here's what's available:";

    addMessage({
      role: "bot",
      text: responseText,
      venues,
      quickReplies: ["Show more venues", "Different sport", "Different city"],
    });
  };

  const handleQuickReply = (reply: string) => {
    const clean = reply.replace(/^[^\w]+/, "").trim();
    handleSend(clean);
  };

  const handleVenueClick = (venue: VenueSuggestion) => {
    router.push(`/venues/${venue.id}`);
    setOpen(false);
  };

  const handleBookNow = (e: React.MouseEvent, venueId: string) => {
    e.stopPropagation();
    setOpen(false);
    checkAuthForBooking(venueId);
  };

  return (
    <>
      <style>{`
        @keyframes botConicSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes botFloatMotion {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes botAuraPulse {
          0% { transform: scale(0.92); opacity: 0.85; }
          50% { transform: scale(1.22); opacity: 0.2; }
          100% { transform: scale(0.92); opacity: 0.85; }
        }
        .bot-spin-slow {
          animation: botConicSpin 4s linear infinite;
        }
        .bot-float-loop {
          animation: botFloatMotion 3.2s ease-in-out infinite;
        }
        .bot-aura-loop {
          animation: botAuraPulse 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Floating Widget Container */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 select-none">
        {/* Floating Extraordinary Icon Button */}
        <div className="relative">
          {!open && (
            <>
              {/* Outer continuous radar ping ring */}
              <div className="absolute -inset-2.5 rounded-full bg-emerald-500/25 bot-aura-loop pointer-events-none" />

              {/* Ambient radial glow aura */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 blur-md opacity-70 pointer-events-none" />

              {/* Spinning holographic conic-gradient border ring */}
              <div className="absolute -inset-[3px] rounded-full p-[2.5px] pointer-events-none overflow-hidden bot-spin-slow">
                <div className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,#10b981,#06b6d4,#6366f1,#ec4899,#10b981)]" />
              </div>
            </>
          )}

          <button
            onClick={() => setOpen((o) => !o)}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl overflow-hidden ${
              open
                ? "bg-slate-900 text-slate-200 border border-white/20 hover:bg-slate-800 hover:scale-105 hover:rotate-90"
                : "bg-slate-950 text-white border border-white/10 hover:scale-110 active:scale-95 group bot-float-loop"
            }`}
            aria-label="Toggle AI Booking Assistant"
          >
            {open ? (
              <X className="w-6 h-6 text-slate-200 hover:text-white transition-transform" />
            ) : (
              <>
                {/* Subtle internal radial light reflection */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(16,185,129,0.35),transparent_65%)]" />

                {/* Looping Bot Icon + Sparkles */}
                <div className="relative flex items-center justify-center">
                  <Bot className="w-7 h-7 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.95)] group-hover:scale-110 transition-all duration-300" />
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 absolute -top-1.5 -right-1.5 animate-pulse" />
                </div>

                {/* Live pulsing online badge */}
                <span className="absolute bottom-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950" />
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
          style={{ height: "540px" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white px-4 py-3.5 flex items-center gap-3 border-b border-white/10 relative overflow-hidden">
            {/* Top glowing accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />

            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-300" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">
                  REVO AI Assistant
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                Instant venue booking across Gujarat
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                    msg.role === "bot"
                      ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {msg.role === "bot" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`flex flex-col gap-2 max-w-[85%] ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {/* Text bubble */}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed shadow-sm ${
                      msg.role === "bot"
                        ? "bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-sm"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Venue cards */}
                  {msg.venues && msg.venues.length > 0 && (
                    <div className="space-y-2.5 w-full mt-1">
                      {msg.venues.map((venue) => (
                        <div
                          key={venue.id}
                          onClick={() => handleVenueClick(venue)}
                          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-emerald-500/40 transition-all duration-200"
                        >
                          {venue.primaryPhoto && (
                            <img
                              src={venue.primaryPhoto}
                              alt={venue.name}
                              className="w-full h-24 object-cover"
                            />
                          )}
                          <div className="p-3">
                            <div className="font-bold text-slate-900 text-sm line-clamp-1">
                              {venue.name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {venue.city}, {venue.state}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                {venue.rating && (
                                  <span className="flex items-center gap-0.5 text-xs text-amber-600 font-semibold">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    {venue.rating.toFixed(1)}
                                  </span>
                                )}
                                <span className="text-xs text-slate-400 ml-1">
                                  {venue.venueType}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                                <IndianRupee className="w-3 h-3" />
                                {venue.minPrice}/hr
                              </span>
                            </div>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {venue.sportTypes.slice(0, 2).map((s) => (
                                <Badge
                                  key={s}
                                  variant="secondary"
                                  className="text-[11px] px-1.5 py-0 bg-slate-100 text-slate-700 font-medium"
                                >
                                  {formatSport(s)}
                                </Badge>
                              ))}
                            </div>
                            <Button
                              size="sm"
                              className="w-full mt-2.5 h-8 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-xs"
                              onClick={(e) => handleBookNow(e, venue.id)}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick replies */}
                  {msg.quickReplies && msg.role === "bot" && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.quickReplies.map((r) => (
                        <button
                          key={r}
                          onClick={() => handleQuickReply(r)}
                          className="text-xs border border-emerald-300/80 bg-emerald-50/80 text-emerald-800 rounded-full px-3 py-1 hover:bg-emerald-100 hover:border-emerald-400 transition-all font-medium shadow-2xs"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-slate-200/80">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSend(input)}
              placeholder="Ask me anything about courts, slots..."
              className="flex-1 text-sm h-10 rounded-xl border-slate-200 focus-visible:ring-emerald-500"
              disabled={loading}
            />
            <Button
              size="sm"
              className="h-10 w-10 p-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm transition-all duration-200"
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
