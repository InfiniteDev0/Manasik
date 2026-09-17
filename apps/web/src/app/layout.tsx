import type { Metadata } from "next";
import { Manrope, Outfit, Geist } from "next/font/google";
import { Toaster } from "@/components/providers/toaster";
import { THEME_INIT_SCRIPT } from "@/features/theme/theme-script";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manasik",
  description: "The operating system for travel agencies.",
};

// Typed explicitly rather than with Next's generated `LayoutProps<"/">`: that
// global only exists once `.next/types` has been produced by a dev/build run,
// so a clean checkout (and CI, which typechecks before building) can't see it.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Theme: light by default, switchable in the user menu. Dark mode is
    // class-based (`@custom-variant dark` in globals.css) — the script below adds
    // "dark" to <html> before first paint when that's the saved choice. Because
    // it changes <html> before React hydrates, the mismatch warning is
    // suppressed here (it only covers this element's own attributes).
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", outfit.variable, manrope.variable, "font-sans", geist.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Mounted once here, not per-form — multiple Toasters render duplicates. */}
        <Toaster />
      </body>
    </html>
  );
}
