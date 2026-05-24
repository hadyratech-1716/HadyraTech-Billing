import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HADYRA BILLING | Enterprise Cloud Billing & Inventory SaaS",
  description: "Enterprise-grade cloud-first billing, GST auditing, customer portfolios, and inventory manager built for HADYRA TECHNOLOGIES.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    google: "w26tvnN5E-xwkmlleYio2YlFlcjzmCo0xs2uWAU8_8U",
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-dark-page text-slate-100">
        {children}
      </body>
    </html>
  );
}
