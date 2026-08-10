import { getRequestLocale } from "@/lib/i18n/server";
import { SignupForm } from "@/app/components/auth/signup-form";
import { createServerT, loadMessages } from "@/lib/i18n";

export default async function SignupPage() {
  const locale = await getRequestLocale();
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold">
          {t("auth.signup.title")}
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {t("auth.signup.desc")}
        </p>
        <SignupForm />
      </div>
    </div>
  );
}
