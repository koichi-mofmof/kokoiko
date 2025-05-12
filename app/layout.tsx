import Footer from "@/app/components/ui/Footer";
import Header from "@/app/components/ui/Header";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, Quicksand } from "next/font/google";
import "./globals.css";

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

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "ClippyMap",
  description: "行きたい場所を共有できるサービス",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ja">
      <body
        className={`${inter.variable} ${notoSansJP.variable} ${quicksand.variable} font-sans min-h-screen bg-neutral-50 flex flex-col`}
      >
        <Header
          currentUser={
            user ? { id: user.id, name: user.email || "User" } : null
          }
        />
        <div className="flex-grow">{children}</div>
        <Footer currentUser={user ? { id: user.id } : null} />
      </body>
    </html>
  );
}
