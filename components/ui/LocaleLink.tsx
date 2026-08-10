"use client";

import NextLink from "next/link";
import { forwardRef } from "react";

import { useI18n } from "@/hooks/use-i18n";
import { localizePath } from "@/lib/i18n/routing";

type LocaleLinkProps = React.ComponentProps<typeof NextLink>;

/**
 * 現在のロケールのプレフィックスを保つ <Link>。
 *
 * next/link の差し替えとして使う（`import Link from "@/components/ui/LocaleLink"`）。
 * 付け忘れても middleware がクッキーを見てリダイレクトするため表示は壊れないが、
 * 余計なリダイレクトが1回挟まり、被リンクも既定ロケール版に集まってしまう。
 */
const LocaleLink = forwardRef<HTMLAnchorElement, LocaleLinkProps>(
  function LocaleLink({ href, ...props }, ref) {
    const { locale } = useI18n();

    // 外部URL・オブジェクト形式のhrefはそのまま通す
    const localizedHref =
      typeof href === "string" && href.startsWith("/")
        ? localizePath(href, locale)
        : href;

    return <NextLink ref={ref} href={localizedHref} {...props} />;
  }
);

export default LocaleLink;
