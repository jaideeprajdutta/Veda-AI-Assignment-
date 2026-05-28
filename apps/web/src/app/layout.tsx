import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";

// Primary typeface — Bricolage Grotesque variable font self-hosted via next/font/local.
const bricolage = localFont({
  src: "../fonts/BricolageGrotesque.ttf",
  variable: "--font-bricolage",
  display: "swap",
  weight: "200 800", // variable range → font-weight utilities work
});

// Secondary / body font for dense text (e.g. exam-paper body).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VedaAI — Assessment Creator",
  description: "Create AI-generated question papers in minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
