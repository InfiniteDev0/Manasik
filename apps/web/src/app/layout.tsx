import type { Metadata } from "next";
import { Manrope, Outfit, Geist } from "next/font/google";
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
  description: "The operating system for Hajj & Umrah agencies.",
};

// Typed explicitly rather than with Next's generated `LayoutProps<"/">`: that
// global only exists once `.next/types` has been produced by a dev/build run,
// so a clean checkout (and CI, which typechecks before building) can't see it.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", outfit.variable, manrope.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
