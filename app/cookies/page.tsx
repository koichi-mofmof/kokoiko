import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { Cookie } from "lucide-react";
import { cookies } from "next/headers";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-2">
    <h2 className="text-xl font-semibold text-neutral-800">{title}</h2>
    <div className="text-neutral-700 space-y-2 leading-relaxed">{children}</div>
  </section>
);

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  return {
    title: t("cookies.meta.title"),
    description: t("cookies.meta.description"),
  };
}

export default async function CookiesPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-neutral-100/80">
            <div className="flex items-center gap-3">
              <Cookie className="h-7 w-7 text-neutral-600" />
              <CardTitle className="text-xl font-bold text-neutral-800">
                {t("cookies.title")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            <Section title={t("cookies.section.preface")}>
              <p>{t("cookies.preface.body")}</p>
            </Section>

            <Section title={t("cookies.section.article1")}>
              <p>{t("cookies.article1.intro")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("cookies.article1.def.cookie")}</li>
                <li>{t("cookies.article1.def.similarTech")}</li>
                <li>{t("cookies.article1.def.necessary")}</li>
                <li>{t("cookies.article1.def.functional")}</li>
                <li>{t("cookies.article1.def.analytics")}</li>
              </ul>
            </Section>

            <Section title={t("cookies.section.article2")}>
              <p>{t("cookies.article2.intro")}</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-neutral-800 mb-2">
                    {t("cookies.article2.necessary.title")}
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t("cookies.article2.necessary.auth")}</li>
                    <li>{t("cookies.article2.necessary.session")}</li>
                    <li>{t("cookies.article2.necessary.security")}</li>
                    <li>{t("cookies.article2.necessary.loadbalancing")}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-neutral-800 mb-2">
                    {t("cookies.article2.functional.title")}
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t("cookies.article2.functional.settings")}</li>
                    <li>{t("cookies.article2.functional.uiState")}</li>
                    <li>{t("cookies.article2.functional.extensions")}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-neutral-800 mb-2">
                    {t("cookies.article2.analytics.title")}
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t("cookies.article2.analytics.ga")}</li>
                    <li>{t("cookies.article2.analytics.performance")}</li>
                    <li>{t("cookies.article2.analytics.userBehavior")}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-neutral-800 mb-2">
                    {t("cookies.article2.integration.title")}
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t("cookies.article2.integration.payment")}</li>
                    <li>{t("cookies.article2.integration.oauth")}</li>
                    <li>{t("cookies.article2.integration.maps")}</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section title={t("cookies.section.article3")}>
              <p>1. {t("cookies.article3.p1")}</p>
              <p>2. {t("cookies.article3.p2intro")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("cookies.article3.caution.necessary")}</li>
                <li>{t("cookies.article3.caution.functional")}</li>
                <li>{t("cookies.article3.caution.analytics")}</li>
              </ul>
              <p>3. {t("cookies.article3.p3")}</p>
            </Section>

            <Section title={t("cookies.section.article4")}>
              <p>1. {t("cookies.article4.p1")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("cookies.article4.use.provide")}</li>
                <li>{t("cookies.article4.use.auth")}</li>
                <li>{t("cookies.article4.use.security")}</li>
                <li>{t("cookies.article4.use.analytics")}</li>
                <li>{t("cookies.article4.use.newFeatures")}</li>
                <li>{t("cookies.article4.use.abuse")}</li>
                <li>{t("cookies.article4.use.troubleshoot")}</li>
                <li>{t("cookies.article4.use.law")}</li>
              </ul>
              <p>2. {t("cookies.article4.p2")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("cookies.article4.share.analytics")}</li>
                <li>{t("cookies.article4.share.stripe")}</li>
                <li>{t("cookies.article4.share.tech")}</li>
                <li>{t("cookies.article4.share.law")}</li>
                <li>{t("cookies.article4.share.contractor")}</li>
              </ul>
            </Section>

            <Section title={t("cookies.section.article5")}>
              <p>{t("cookies.article5.intro")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("cookies.article5.session")}</li>
                <li>{t("cookies.article5.auth")}</li>
                <li>{t("cookies.article5.settings")}</li>
                <li>{t("cookies.article5.analytics")}</li>
                <li>{t("cookies.article5.others")}</li>
              </ul>
              <p>{t("cookies.article5.note")}</p>
            </Section>

            <Section title={t("cookies.section.article6")}>
              <p>{t("cookies.article6.body")}</p>
            </Section>

            <Section title={t("cookies.section.article7")}>
              <p>1. {t("cookies.article7.p1")}</p>
              <p>2. {t("cookies.article7.p2")}</p>
              <p>3. {t("cookies.article7.p3")}</p>
            </Section>

            <Section title={t("cookies.section.article8")}>
              <p>1. {t("cookies.article8.p1")}</p>
              <p>2. {t("cookies.article8.p2")}</p>
              <p>3. {t("cookies.article8.p3")}</p>
            </Section>

            <Section title={t("cookies.section.article9")}>
              <p>1. {t("cookies.article9.p1")}</p>
              <p>2. {t("cookies.article9.p2")}</p>
            </Section>

            <Section title={t("cookies.section.article10")}>
              <p>
                {t("cookies.article10.p1.before")}
                <a
                  href="/privacy"
                  className="text-blue-600 underline hover:text-blue-800 transition"
                >
                  {t("cookies.article10.p1.link")}
                </a>
                {t("cookies.article10.p1.after")}
              </p>
            </Section>

            <div className="text-right text-sm text-neutral-600 mt-8">
              <p>{t("common.enactedAt")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
