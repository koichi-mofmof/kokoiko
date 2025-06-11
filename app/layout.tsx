import { AuthSyncProvider } from "@/app/components/auth/auth-sync-provider";
import { ProfileSetupProvider } from "@/app/components/auth/profile-setup-provider";
import JsonLd from "@/components/seo/JsonLd";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionProvider } from "@/contexts/SubscriptionProvider";
import { logoutUser } from "@/lib/actions/auth";
import type { ProfileSettingsData } from "@/lib/dal/users";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/seo/structured-data";
import { createClient } from "@/lib/supabase/server";
import "leaflet/dist/leaflet.css";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ClippyMap",
    description: "行きたい場所を共有できるサービス",
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "ClippyMap",
    images: [
      {
        url: "/ogp-image.png",
        width: 1200,
        height: 630,
        alt: "ClippyMap - 行きたい場所を共有できるサービス",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClippyMap",
    description: "行きたい場所を共有できるサービス",
    images: ["/ogp-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
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

  let profileData: ProfileSettingsData | null = null;
  if (user) {
    // profiles_decryptedビューを使用して復号化されたデータを取得
    const { data: profile } = await supabase
      .from("profiles_decrypted")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      let publicAvatarUrl = null;
      if (profile.avatar_url) {
        // GoogleのアバターURLかチェック（http/httpsで始まる場合はそのまま使用）
        if (
          profile.avatar_url.startsWith("http://") ||
          profile.avatar_url.startsWith("https://")
        ) {
          publicAvatarUrl = profile.avatar_url;
        } else {
          // ローカルストレージのファイルの場合はpublic URLを取得
          const { data } = supabase.storage
            .from("profile_images")
            .getPublicUrl(profile.avatar_url);
          publicAvatarUrl = data.publicUrl;
        }
      }

      profileData = {
        userId: user.id,
        username: profile.username,
        displayName: profile.display_name,
        bio: profile.bio,
        avatarUrl: publicAvatarUrl,
        avatarPath: profile.avatar_url,
      };
    }
  }

  return (
    <html lang="ja">
      <head>
        <JsonLd data={generateOrganizationSchema()} />
        <JsonLd data={generateWebSiteSchema()} />
      </head>
      <body
        className={`${inter.variable} ${notoSansJP.variable} ${quicksand.variable} font-sans min-h-screen bg-neutral-50 flex flex-col`}
      >
        <AuthSyncProvider>
          <SubscriptionProvider>
            {user && profileData ? (
              <ProfileSetupProvider profileData={profileData}>
                <Header
                  currentUser={
                    user
                      ? {
                          id: user.id,
                          name: profileData?.displayName || "User",
                          email: user.email || "",
                          avatarUrl: profileData?.avatarUrl,
                        }
                      : null
                  }
                  onLogout={logoutUser}
                />
                <main className="flex-grow">{children}</main>
                <Footer currentUser={user ? { id: user.id } : null} />
              </ProfileSetupProvider>
            ) : (
              <>
                <Header currentUser={null} onLogout={logoutUser} />
                <main className="flex-grow">{children}</main>
                <Footer currentUser={null} />
              </>
            )}
          </SubscriptionProvider>
        </AuthSyncProvider>
        <Toaster />
      </body>
    </html>
  );
}
