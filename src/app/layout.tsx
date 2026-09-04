import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavWrapper from "@/components/layout/NavWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "모아보다",
  description: "나의 문화생활 기록",
  icons: {
    icon: [
      { url: "/assets/favicon.svg", type: "image/svg+xml" },
      { url: "/assets/app-icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/assets/app-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#27473C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
        <NavWrapper />
      </body>
    </html>
  );
}
