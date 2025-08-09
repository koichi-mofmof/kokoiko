import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";

export default async function NoAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 md:py-16">
      <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-red-500 mb-3 md:mb-4" />
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-2 text-center">
        {t("noAccess.title")}
      </h2>
      <p className="text-sm md:text-base text-neutral-500 mb-6 md:mb-4 text-center max-w-md leading-relaxed">
        {t("noAccess.line1")}
        <br />
        {t("noAccess.line2")}
      </p>
      {user ? (
        <Link
          href="/lists"
          className="text-primary-600 hover:underline text-sm md:text-base px-4 py-2 hover:bg-primary-50 rounded-md transition-colors"
        >
          {t("noAccess.backToLists")}
        </Link>
      ) : (
        <Link
          href="/"
          className="text-primary-600 hover:underline text-sm md:text-base px-4 py-2 hover:bg-primary-50 rounded-md transition-colors"
        >
          {t("noAccess.backToHome")}
        </Link>
      )}
    </div>
  );
}
