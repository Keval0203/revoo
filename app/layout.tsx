import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BookingBotWrapper } from "@/components/layout/BookingBotWrapper";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "REVO | Sports Venue Booking",
  description: "Book Gujarat's best sports courts with REVO — Ahmedabad, Surat, Vadodara, Rajkot, Gandhinagar and more.",
  keywords: "REVO, sports booking, Gujarat courts, badminton, tennis, football, cricket, Ahmedabad, Surat, Vadodara",
  authors: [{ name: "REVO" }],
  icons: { icon: "/revo-logo.svg", apple: "/revo-logo.svg" },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground transition-colors duration-200`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen">
            {children}
          </main>
          <BookingBotWrapper />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
