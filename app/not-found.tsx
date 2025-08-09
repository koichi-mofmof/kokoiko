import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function NotFound() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("lang")?.value;
  const locale = normalizeLocale(rawLocale);
  const messages = await loadMessages(locale);
  const t = createServerT(messages);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {t("notFound.page.title")}
          </h2>
          <p className="text-gray-600">{t("notFound.page.desc")}</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("notFound.backHome")}
          </Link>

          <div>
            <Link
              href="/lists"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {t("notFound.viewLists")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
