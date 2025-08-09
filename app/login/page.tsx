import { LoginForm } from "@/app/components/auth/login-form";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold">
          {t("auth.login.title")}
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {t("auth.login.desc")}
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
