import Footer from "@/app/components/ui/Footer";
import Header from "@/app/components/ui/Header";
import { Toaster } from "@/components/ui/toaster";
import { logoutUser } from "@/lib/actions/auth";
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

  // ユーザープロフィール情報の取得
  let avatarUrl = null;
  let displayName = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (profile) {
      displayName = profile.display_name || null;

      if (profile.avatar_url) {
        const { data: imageData } = await supabase.storage
          .from("profile_images")
          .getPublicUrl(profile.avatar_url);

        avatarUrl = imageData?.publicUrl || null;
      }
    }
  }

  return (
    <html lang="ja">
      <body
        className={`${inter.variable} ${notoSansJP.variable} ${quicksand.variable} font-sans min-h-screen bg-neutral-50 flex flex-col`}
      >
        <Header
          currentUser={
            user
              ? {
                  id: user.id,
                  name: displayName || "User",
                  email: user.email || "",
                  avatarUrl,
                }
              : null
          }
          onLogout={logoutUser}
        />
        <div className="flex-grow">{children}</div>
        <Footer currentUser={user ? { id: user.id } : null} />
        <Toaster />
      </body>
    </html>
  );
}
