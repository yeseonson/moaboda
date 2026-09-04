import type { Metadata, Viewport } from "next";
import { Geist_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";
import NavWrapper from "@/components/layout/NavWrapper";

// 워드마크와 같은 서체. Geist 는 latin 서브셋만 받아서 한글이 시스템 폰트로 떨어졌다.
const plexSansKr = IBM_Plex_Sans_KR({
  variable: "--font-plex-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
      className={`${plexSansKr.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
        <NavWrapper />
      </body>
    </html>
  );
}
