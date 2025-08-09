import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
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
    title: t("privacy.meta.title"),
    description: t("privacy.meta.description"),
  };
}

export default async function PrivacyPage() {
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
              <ShieldCheck className="h-7 w-7 text-neutral-600" />
              <CardTitle className="text-xl font-bold text-neutral-800">
                {t("privacy.title")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            <Section title={t("privacy.section.preface")}>
              <p>{t("privacy.preface.body")}</p>
            </Section>

            <Section title={t("privacy.section.article1")}>
              <p>{t("privacy.article1.intro")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("privacy.article1.def1")}</li>
                <li>{t("privacy.article1.def2")}</li>
                <li>{t("privacy.article1.def3")}</li>
                <li>{t("privacy.article1.def4")}</li>
              </ul>
            </Section>

            <Section title={t("privacy.section.article2")}>
              <p>{t("privacy.article2.intro")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("privacy.article2.item1")}</li>
                <li>{t("privacy.article2.item2")}</li>
                <li>{t("privacy.article2.item3")}</li>
                <li>{t("privacy.article2.item4")}</li>
                <li>{t("privacy.article2.item5")}</li>
                <li>{t("privacy.article2.item6")}</li>
              </ul>
            </Section>

            <Section title={t("privacy.section.article3")}>
              <p>{t("privacy.article3.intro")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("privacy.article3.item1")}</li>
                <li>{t("privacy.article3.item2")}</li>
                <li>{t("privacy.article3.item3")}</li>
                <li>{t("privacy.article3.item4")}</li>
                <li>{t("privacy.article3.item5")}</li>
                <li>{t("privacy.article3.item6")}</li>
                <li>{t("privacy.article3.item7")}</li>
                <li>{t("privacy.article3.item8")}</li>
                <li>{t("privacy.article3.item9")}</li>
                <li>{t("privacy.article3.item10")}</li>
                <li>{t("privacy.article3.item11")}</li>
                <li>{t("privacy.article3.item12")}</li>
              </ul>
            </Section>

            <Section title={t("privacy.section.article4")}>
              <p>1. {t("privacy.article4.p1")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("privacy.article4.item1")}</li>
                <li>{t("privacy.article4.item2")}</li>
                <li>{t("privacy.article4.item3")}</li>
                <li>{t("privacy.article4.item4")}</li>
                <li>{t("privacy.article4.item5")}</li>
                <li>{t("privacy.article4.item6")}</li>
                <li>{t("privacy.article4.item7")}</li>
                <li>{t("privacy.article4.item8")}</li>
              </ul>
              <p>2. {t("privacy.article4.p2")}</p>
            </Section>

            <Section title={t("privacy.section.article5")}>
              <p>1. {t("privacy.article5.p1")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("privacy.article5.item1")}</li>
                <li>{t("privacy.article5.item2")}</li>
                <li>{t("privacy.article5.item3")}</li>
                <li>{t("privacy.article5.item4")}</li>
                <li>{t("privacy.article5.item5")}</li>
              </ul>
              <p>2. {t("privacy.article5.p2")}</p>
            </Section>

            <Section title={t("privacy.section.article6")}>
              <p>1. {t("privacy.article6.p1")}</p>
              <p>2. {t("privacy.article6.p2")}</p>
              <p>
                3. {t("privacy.article6.p3.before")}
                <a
                  href="https://marketingplatform.google.com/about/analytics/terms/jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 transition"
                >
                  {t("privacy.article6.p3.link")}
                </a>
                {t("privacy.article6.p3.after")}
              </p>
            </Section>

            <Section title={t("privacy.section.article7")}>
              <p>1. {t("privacy.article7.p1")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("privacy.article7.right1")}</li>
                <li>{t("privacy.article7.right2")}</li>
                <li>{t("privacy.article7.right3")}</li>
                <li>{t("privacy.article7.right4")}</li>
              </ul>
              <p>2. {t("privacy.article7.p2")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("privacy.article7.denial1")}</li>
                <li>{t("privacy.article7.denial2")}</li>
                <li>{t("privacy.article7.denial3")}</li>
                <li>{t("privacy.article7.denial4")}</li>
              </ul>
              <p>3. {t("privacy.article7.p3")}</p>
            </Section>

            <Section title={t("privacy.section.article8")}>
              <p>1. {t("privacy.article8.p1")}</p>
              <p>2. {t("privacy.article8.p2")}</p>
              <p>3. {t("privacy.article8.p3")}</p>
            </Section>

            <Section title={t("privacy.section.article9")}>
              <p>{t("privacy.article9.p1")}</p>
            </Section>

            <Section title={t("privacy.section.article10")}>
              <p>1. {t("privacy.article10.p1")}</p>
              <p>2. {t("privacy.article10.p2")}</p>
              <p>3. {t("privacy.article10.p3")}</p>
            </Section>

            <Section title={t("privacy.section.article11")}>
              <p>1. {t("privacy.article11.p1")}</p>
              <p>2. {t("privacy.article11.p2")}</p>
            </Section>

            <Section title={t("privacy.section.article12")}>
              <p>{t("privacy.article12.p1")}</p>
              <Button variant="secondary" asChild>
                <a
                  href="https://forms.gle/vg9kMmdKiKxxN6EU6"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("privacy.contactButton")}
                </a>
              </Button>
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
