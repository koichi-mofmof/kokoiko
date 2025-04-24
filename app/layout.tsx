import "./globals.css";
import { Inter } from "next/font/google";
import { Noto_Sans_JP } from "next/font/google";
import type { Metadata } from "next";
import Header from "@/app/components/ui/Header";
import Footer from "@/app/components/ui/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "ココイコ",
  description: "行きたい場所を共有できるサービス",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body
        className={`${inter.variable} ${notoSansJP.variable} font-sans min-h-screen bg-neutral-50 flex flex-col`}
      >
        <Header />
        <div className="flex-grow">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
