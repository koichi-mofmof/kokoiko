import { ReactNode } from "react";
import { Metadata } from "next";
import { Tabs } from "./_components/tabs";

export const metadata: Metadata = {
  title: "設定 | ClippyMap",
  description: "アカウント設定の管理",
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container py-6 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center sm:text-left">
          設定
        </h1>
        <Tabs />
        {children}
      </div>
    </div>
  );
}
