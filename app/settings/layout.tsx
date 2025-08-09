import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { ReactNode } from "react";
import { Tabs } from "./_components/tabs";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  return {
    title: t("settings.meta.title"),
    description: t("settings.meta.description"),
  };
}

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  return (
    <div className="container py-6 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center sm:text-left">
          {t("settings.title")}
        </h1>
        <Tabs />
        {children}
      </div>
    </div>
  );
}
