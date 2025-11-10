import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Odoo Orchestrator - Odoo Proje Yönetim Platformu",
    template: "%s | Odoo Orchestrator",
  },
  description: "Odoo proje yönetimi için kapsamlı platform. Keşif, analiz, takvim, iletişim ve AI destekli otomasyon araçları.",
  keywords: ["Odoo", "ERP", "proje yönetimi", "iş otomasyonu", "CRM", "Türkiye"],
  authors: [{ name: "Odoo Orchestrator Team" }],
  creator: "Odoo Orchestrator",
  publisher: "Odoo Orchestrator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "/",
    title: "Odoo Orchestrator - Odoo Proje Yönetim Platformu",
    description: "Odoo proje yönetimi için kapsamlı platform. Keşif, analiz, takvim, iletişim ve AI destekli otomasyon araçları.",
    siteName: "Odoo Orchestrator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Odoo Orchestrator - Odoo Proje Yönetim Platformu",
    description: "Odoo proje yönetimi için kapsamlı platform.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console verification code can be added here
    // google: "verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
