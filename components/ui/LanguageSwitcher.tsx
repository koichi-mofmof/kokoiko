"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/hooks/use-i18n";
import { ChevronDown, Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const currentLabel =
    locale === "en"
      ? t("lang.english")
      : locale === "ja"
      ? t("lang.japanese")
      : locale === "es"
      ? t("lang.spanish")
      : locale === "fr"
      ? t("lang.french")
      : t("lang.german");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={currentLabel}
          className="text-sm text-neutral-700 flex items-center"
        >
          <Languages
            className="h-4 w-4 hidden sm:inline sm:mr-2"
            aria-hidden="true"
          />
          <span>{currentLabel}</span>
          <ChevronDown className="h-4 w-4 ml-1 opacity-70" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale("ja")}>
          {t("lang.japanese")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("en")}>
          {t("lang.english")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("es")}>
          {t("lang.spanish")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("fr")}>
          {t("lang.french")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("de")}>
          {t("lang.german")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
