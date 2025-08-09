"use client";

import { useI18n } from "@/hooks/use-i18n";
import { CreditCard, Shield, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Tabs() {
  const pathname = usePathname();
  const { t } = useI18n();

  const tabs = [
    {
      href: "/settings",
      label: t("settings.tabs.profile"),
      icon: <User className="w-5 h-5" />,
    },
    {
      href: "/settings/account",
      label: t("settings.tabs.account"),
      icon: <Shield className="w-5 h-5" />,
    },
    {
      href: "/settings/billing",
      label: t("settings.tabs.billing"),
      icon: <CreditCard className="w-5 h-5" />,
    },
  ];

  return (
    <div className="border-b mb-8 overflow-x-auto pb-0.5">
      <div className="flex min-w-full justify-center">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center py-3 px-3 sm:px-4 justify-center space-x-1 sm:space-x-2 border-b-2 flex-1 text-center whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="text-xs sm:text-sm">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
