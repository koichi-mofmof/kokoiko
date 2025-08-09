import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { cookies } from "next/headers";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import type { Metadata } from "next";

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
    title: t("terms.meta.title"),
    description: t("terms.meta.description"),
  };
}

export default async function TermsPage() {
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
              <FileText className="h-7 w-7 text-neutral-600" />
              <CardTitle className="text-xl font-bold text-neutral-800">
                {t("terms.title")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            <Section title={t("terms.section.preface")}>
              <p>{t("terms.preamble.body")}</p>
            </Section>

            <Section title={t("terms.section.article1")}>
              <p>{t("terms.article1.intro")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("terms.article1.def1")}</li>
                <li>{t("terms.article1.def2")}</li>
                <li>{t("terms.article1.def3")}</li>
                <li>{t("terms.article1.def4")}</li>
              </ul>
            </Section>

            <Section title={t("terms.section.article2")}>
              <p>1. {t("terms.article2.p1")}</p>
              <p>2. {t("terms.article2.p2")}</p>
              <p>3. {t("terms.article2.p3")}</p>
            </Section>

            <Section title={t("terms.section.article3")}>
              <p>1. {t("terms.article3.p1")}</p>
              <p>2. {t("terms.article3.p2")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("terms.article3.item1")}</li>
                <li>{t("terms.article3.item2")}</li>
                <li>{t("terms.article3.item3")}</li>
                <li>{t("terms.article3.item4")}</li>
                <li>{t("terms.article3.item5")}</li>
              </ul>
            </Section>

            <Section title={t("terms.section.article4")}>
              <p>1. {t("terms.article4.p1")}</p>
              <p>2. {t("terms.article4.p2")}</p>
              <p>3. {t("terms.article4.p3")}</p>
            </Section>

            <Section title={t("terms.section.article5")}>
              <p>1. {t("terms.article5.p1")}</p>
              <p>2. {t("terms.article5.p2")}</p>
              <p>3. {t("terms.article5.p3")}</p>
              <p>4. {t("terms.article5.p4")}</p>
              <p>5. {t("terms.article5.p5")}</p>
            </Section>

            <Section title={t("terms.section.article6")}>
              <p>{t("terms.article6.intro")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("terms.article6.item1")}</li>
                <li>{t("terms.article6.item2")}</li>
                <li>{t("terms.article6.item3")}</li>
                <li>{t("terms.article6.item4")}</li>
                <li>{t("terms.article6.item5")}</li>
                <li>{t("terms.article6.item6")}</li>
                <li>{t("terms.article6.item7")}</li>
                <li>{t("terms.article6.item8")}</li>
                <li>{t("terms.article6.item9")}</li>
                <li>{t("terms.article6.item10")}</li>
                <li>{t("terms.article6.item11")}</li>
                <li>{t("terms.article6.item12")}</li>
                <li>{t("terms.article6.item13")}</li>
                <li>{t("terms.article6.item14")}</li>
                <li>{t("terms.article6.item15")}</li>
              </ul>
            </Section>

            <Section title={t("terms.section.article7")}>
              <p>1. {t("terms.article7.p1")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("terms.article7.item1")}</li>
                <li>{t("terms.article7.item2")}</li>
                <li>{t("terms.article7.item3")}</li>
                <li>{t("terms.article7.item4")}</li>
              </ul>
              <p>2. {t("terms.article7.p2")}</p>
            </Section>

            <Section title={t("terms.section.article8")}>
              <p>1. {t("terms.article8.p1")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("terms.article8.item1")}</li>
                <li>{t("terms.article8.item2")}</li>
                <li>{t("terms.article8.item3")}</li>
                <li>{t("terms.article8.item4")}</li>
                <li>{t("terms.article8.item5")}</li>
                <li>{t("terms.article8.item6")}</li>
              </ul>
              <p>2. {t("terms.article8.p2")}</p>
            </Section>

            <Section title={t("terms.section.article9")}>
              <p>1. {t("terms.article9.p1")}</p>
              <p>2. {t("terms.article9.p2")}</p>
              <p>3. {t("terms.article9.p3")}</p>
            </Section>

            <Section title={t("terms.section.article10")}>
              <p>1. {t("terms.article10.p1")}</p>
              <p>2. {t("terms.article10.p2")}</p>
              <p>3. {t("terms.article10.p3")}</p>
              <p>4. {t("terms.article10.p4")}</p>
            </Section>

            <Section title={t("terms.section.article11")}>
              <p>1. {t("terms.article11.p1")}</p>
              <p>2. {t("terms.article11.p2")}</p>
              <p>3. {t("terms.article11.p3")}</p>
            </Section>

            <Section title={t("terms.section.article12")}>
              <p>1. {t("terms.article12.p1")}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("terms.article12.item1")}</li>
                <li>{t("terms.article12.item2")}</li>
              </ul>
              <p>2. {t("terms.article12.p2")}</p>
            </Section>

            <Section title={t("terms.section.article13")}>
              <p>{t("terms.article13.p1")}</p>
            </Section>

            <Section title={t("terms.section.article14")}>
              <p>{t("terms.article14.p1")}</p>
            </Section>

            <Section title={t("terms.section.article15")}>
              <p>{t("terms.article15.p1")}</p>
            </Section>

            <Section title={t("terms.section.article16")}>
              <p>{t("terms.article16.p1")}</p>
            </Section>

            <Section title={t("terms.section.article17")}>
              <p>1. {t("terms.article17.p1")}</p>
              <p>2. {t("terms.article17.p2")}</p>
            </Section>

            <Section title={t("terms.section.article18")}>
              <p>{t("terms.article18.p1")}</p>
            </Section>

            <Section title={t("terms.section.article19")}>
              <p>{t("terms.article19.p1")}</p>
            </Section>

            <Section title={t("terms.section.addendum")}>
              <p className="text-sm">{t("common.enactedAt")}</p>
            </Section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
