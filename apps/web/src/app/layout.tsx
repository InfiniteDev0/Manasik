import type { Metadata } from "next";
import { Manrope, Outfit, Geist } from "next/font/google";
import { Toaster } from "@/components/providers/toaster";
import { getTheme } from "@/features/theme/get-theme";
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
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Light by default, switchable in the user menu. The choice is a cookie, so
  // the "dark" class is already on <html> in the HTML the server sends — no
  // flash of the wrong theme, and no inline script (see features/theme/theme.ts).
  const theme = await getTheme();

  return (
    <html
      lang="en"
      style={{ colorScheme: theme }}
      className={cn("h-full", "antialiased", outfit.variable, manrope.variable, "font-sans", geist.variable, theme === "dark" && "dark")}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Mounted once here, not per-form — multiple Toasters render duplicates. */}
        <Toaster />
      </body>
    </html>
  );
}
