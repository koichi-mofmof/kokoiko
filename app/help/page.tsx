import { Button } from "@/components/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { HelpCircle } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  return {
    title: t("help.meta.title"),
    description: t("help.meta.description"),
  };
}

export default async function HelpPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);

  const faqs = [
    {
      question: t("help.faq.q1"),
      answer: (
        <>
          <p className="mb-1">{t("help.faq.q1.a1")}</p>
          <p className="mb-1">{t("help.faq.q1.a2")}</p>
          <p className="mb-1">{t("help.faq.q1.a3")}</p>
        </>
      ),
    },
    {
      question: t("help.faq.q2"),
      answer: t("help.faq.q2.a1"),
    },
    {
      question: t("help.faq.q3"),
      answer: t("help.faq.q3.a1"),
    },
    {
      question: t("help.faq.q4"),
      answer: t("help.faq.q4.a1"),
    },
    {
      question: t("help.faq.q5"),
      answer: t("help.faq.q5.a1"),
    },
    {
      question: t("help.faq.q6"),
      answer: t("help.faq.q6.a1"),
    },
    {
      question: t("help.faq.q7"),
      answer: (
        <>
          <p className="mb-1">{t("help.faq.q7.a1")}</p>
          <p className="mb-1">{t("help.faq.q7.a2")}</p>
          <p className="mb-1">{t("help.faq.q7.a3")}</p>
        </>
      ),
    },
    {
      question: t("help.faq.q8"),
      answer: (
        <>
          <p>{t("help.faq.q8.a1")}</p>
          <Button asChild variant="secondary" className="mt-3">
            <a
              href="https://forms.gle/vg9kMmdKiKxxN6EU6"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("help.contactButton")}
            </a>
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="bg-neutral-50">
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-8">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 bg-neutral-100/80 p-4">
              <HelpCircle className="h-6 w-6 text-neutral-600" />
              <CardTitle className="text-neutral-800 text-xl">
                {t("help.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-left font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 pt-2 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
