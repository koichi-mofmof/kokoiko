import GoogleAnalytics from "@/app/components/analytics/GoogleAnalytics";
import GoogleSearchConsole from "@/app/components/analytics/GoogleSearchConsole";
import { AuthSyncProvider } from "@/app/components/auth/auth-sync-provider";
import { ProfileSetupProvider } from "@/app/components/auth/profile-setup-provider";
import JsonLd from "@/components/seo/JsonLd";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/contexts/I18nProvider";
import { SubscriptionProvider } from "@/contexts/SubscriptionProvider";
import { logoutUser } from "@/lib/actions/auth";
import { getActiveSubscription } from "@/lib/dal/subscriptions";
import type { ProfileSettingsData } from "@/lib/dal/users";
import { loadMessages, toOpenGraphLocale } from "@/lib/i18n";
import { buildAlternates, getRequestLocale, getServerI18n } from "@/lib/i18n/server";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/seo/structured-data";
import { createClient } from "@/lib/supabase/server";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, Quicksand } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-jp",
  preload: true,
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-quicksand",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();

  const metadataBase = new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );

  // 検索意図に合わせたタイトル・説明文（ブランド名だけでは検索で拾われないため）
  const title = t("meta.root.title");
  const description = t("meta.root.description");
  const alternates = await buildAlternates("/");

  return {
    title,
    description,
    metadataBase,
    alternates,
    openGraph: {
      title,
      description,
      type: "website",
      locale: toOpenGraphLocale(locale),
      // 言語版ごとに自分自身を指す（"/"固定だと英語版をシェアしても日本語版が展開される）
      url: alternates.canonical,
      siteName: "ClippyMap",
      images: [
        {
          url: "/ogp-image.webp",
          width: 1200,
          height: 630,
          alt: t("meta.root.ogAlt"),
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: "/ogp-image.webp",
          alt: t("meta.root.ogAlt"),
        },
      ],
    },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        {
          url: "/web-app-manifest-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/web-app-manifest-512x512.webp",
          sizes: "512x512",
          type: "image/webp",
        },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.json",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ロケールはURL（middlewareが x-locale ヘッダに載せる）が最優先。
  // クッキーはプレフィックス無しURLでのフォールバックにすぎない。
  const locale = await getRequestLocale();
  const messages = (await loadMessages(locale)) as Record<string, string>;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // nonceを取得
  const nonce = (await headers()).get("x-nonce");

  // サブスクリプション状態を確認（プレミアムユーザーには広告を表示しない）
  let isPremium = false;
  if (user) {
    try {
      const subscription = await getActiveSubscription(user.id);
      isPremium =
        subscription &&
        (subscription.status === "active" ||
          subscription.status === "trialing");
    } catch (error) {
      console.error("Subscription check failed:", error);
      // エラー時は安全側（広告非表示）にフォールバック
      isPremium = true;
    }
  }

  // 本番環境かつ非プレミアムユーザーの場合のみ広告表示
  const shouldShowAds = !isPremium && process.env.NODE_ENV === "production";

  let profileData: ProfileSettingsData | null = null;
  if (user) {
    // profilesテーブルから直接データを取得
    const { data: profile } = await supabase
      .from("profiles")
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
    <html lang={locale}>
      <head>
        {/* DNS プリフェッチとプリコネクト */}
        <link rel="preconnect" href="https://images.pexels.com" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Google AdSense用プリコネクト - フリープランユーザーのみ */}
        {shouldShowAds && (
          <>
            <link
              rel="preconnect"
              href="https://pagead2.googlesyndication.com"
            />
            <link
              rel="dns-prefetch"
              href="https://pagead2.googlesyndication.com"
            />
          </>
        )}

        <GoogleSearchConsole />
        <JsonLd data={generateOrganizationSchema()} />
        <JsonLd data={generateWebSiteSchema()} />
      </head>
      <body
        className={`${inter.variable} ${notoSansJP.variable} ${quicksand.variable} font-sans min-h-screen bg-neutral-50 flex flex-col`}
      >
        <AuthSyncProvider>
          <SubscriptionProvider serverUserId={user?.id ?? null}>
            <I18nProvider initialLocale={locale} messages={messages}>
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
            </I18nProvider>
          </SubscriptionProvider>
        </AuthSyncProvider>
        <Toaster />
        <GoogleAnalytics nonce={nonce ?? undefined} />

        {/* Google AdSense自動広告スクリプト - Next.js最適化版 */}
        {shouldShowAds && (
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9713366549691329"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
