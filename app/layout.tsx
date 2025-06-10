import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionProvider } from "@/contexts/SubscriptionProvider";
import { logoutUser } from "@/lib/actions/auth";
import type { ProfileSettingsData } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/server";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, Quicksand } from "next/font/google";
import { ProfileSetupProvider } from "@/app/components/auth/profile-setup-provider";
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

  let profileData: ProfileSettingsData | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      let publicAvatarUrl = null;
      if (profile.avatar_url) {
        const { data } = supabase.storage
          .from("profile_images")
          .getPublicUrl(profile.avatar_url);
        publicAvatarUrl = data.publicUrl;
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
      <body
        className={`${inter.variable} ${notoSansJP.variable} ${quicksand.variable} font-sans min-h-screen bg-neutral-50 flex flex-col`}
      >
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
        <Toaster />
      </body>
    </html>
  );
}
