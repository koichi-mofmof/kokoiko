import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DISPLAY_PRICES,
  formatPrice,
  inferCurrencyFromLocale,
  type SupportedCurrency,
} from "@/lib/constants/config/subscription";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col sm:table-row border-b border-neutral-100 last:border-b-0">
    <div className="sm:table-cell py-3 sm:py-2 pr-0 sm:pr-4 w-full sm:w-40 text-neutral-700 font-medium text-sm sm:text-base sm:align-top sm:whitespace-nowrap">
      <span className="block mb-1 sm:mb-0">{label}</span>
    </div>
    <div className="sm:table-cell py-0 sm:py-2 text-neutral-800 text-sm sm:text-base">
      {children}
    </div>
  </div>
);

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  return {
    title: t("tokushoho.meta.title"),
    description: t("tokushoho.meta.description"),
  };
}

export default async function TokushohoPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  const currency: SupportedCurrency = inferCurrencyFromLocale(locale);
  const monthlyPrice = formatPrice(
    DISPLAY_PRICES[currency].monthly,
    currency,
    locale
  );
  const yearlyPrice = formatPrice(
    DISPLAY_PRICES[currency].yearly,
    currency,
    locale
  );
  return (
    <div className="bg-neutral-50 py-4 sm:py-8">
      <div className="max-w-3xl w-full mx-auto p-3 sm:p-4 md:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-neutral-100/80 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-neutral-600 flex-shrink-0" />
              <CardTitle className="text-lg sm:text-xl font-bold text-neutral-800 leading-tight">
                {t("tokushoho.title")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:table w-full sm:border-separate sm:border-spacing-y-1">
              <div className="sm:table-body">
                <Row label={t("tokushoho.label.sellerName")}>
                  <span>{t("tokushoho.value.sellerName")}</span>
                </Row>
                <Row label={t("tokushoho.label.manager")}>
                  {t("tokushoho.value.manager")}
                </Row>
                <Row label={t("tokushoho.label.address")}>
                  <span className="text-sm text-neutral-600">
                    {t("tokushoho.value.discloseOnRequest")}
                  </span>
                </Row>
                <Row label={t("tokushoho.label.phone")}>
                  <span className="text-sm text-neutral-600">
                    {t("tokushoho.value.discloseOnRequest")}
                  </span>
                </Row>
                <Row label={t("tokushoho.label.contact")}>
                  <div className="space-y-3">
                    <div className="break-words">
                      <strong className="block sm:inline">
                        {t("tokushoho.value.emailLabel")}：
                      </strong>
                      <a
                        href="mailto:contact@clippymap.com"
                        className="text-blue-600 hover:underline mt-1 sm:mt-0 sm:ml-1 block sm:inline break-all"
                      >
                        clippymap@gmail.com
                      </a>
                    </div>
                    <div>
                      <Button
                        variant="secondary"
                        asChild
                        className="w-full sm:w-auto text-sm"
                      >
                        <a
                          href="https://forms.gle/vg9kMmdKiKxxN6EU6"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t("tokushoho.contactButton")}
                        </a>
                      </Button>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {t("tokushoho.value.contactSla")}
                    </div>
                  </div>
                </Row>
                <Row label={t("tokushoho.label.price")}>
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      {t("tokushoho.value.priceMonthlyDynamic", {
                        price: monthlyPrice,
                      })}
                    </div>
                    <div className="text-sm sm:text-base">
                      {t("tokushoho.value.priceYearlyDynamic", {
                        price: yearlyPrice,
                      })}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {t("tokushoho.value.priceNote")}
                    </div>
                  </div>
                </Row>
                <Row label={t("tokushoho.label.additionalFees")}>
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      {t("tokushoho.value.noExtraFees")}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-600">
                      {t("tokushoho.value.cardFeeIncluded")}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-600">
                      {t("tokushoho.value.taxIncluded")}
                    </div>
                  </div>
                </Row>
                <Row label={t("tokushoho.label.paymentTimingMethod")}>
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      {t("tokushoho.value.paymentPrepaid")}
                    </div>
                    <div className="text-sm sm:text-base">
                      {t("tokushoho.value.paymentMonthly")}
                    </div>
                    <div className="text-sm sm:text-base">
                      {t("tokushoho.value.paymentYearly")}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {t("tokushoho.value.stripeNote")}
                    </div>
                  </div>
                </Row>
                <Row label={t("tokushoho.label.serviceProvision")}>
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      {t("tokushoho.value.serviceAvailability")}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {t("tokushoho.value.serviceDelayNote")}
                    </div>
                  </div>
                </Row>
                <Row label={t("tokushoho.label.refundPolicy")}>
                  <div className="space-y-3">
                    <div className="font-medium text-sm sm:text-base">
                      {t("tokushoho.value.refundPolicyIntro")}
                    </div>
                    <ul className="text-xs sm:text-sm space-y-2 list-disc pl-4">
                      <li>
                        <strong>{t("tokushoho.value.noRefundTitle")}</strong>
                        {t("tokushoho.value.noRefundBody")}
                      </li>
                      <li>
                        <strong>{t("tokushoho.value.freeTrialTitle")}</strong>
                        {t("tokushoho.value.freeTrialBody")}
                      </li>
                      <li>
                        <strong>
                          {t("tokushoho.value.autoRenewStopTitle")}
                        </strong>
                        {t("tokushoho.value.autoRenewStopBody")}
                      </li>
                      <li>
                        <strong>
                          {t("tokushoho.value.operatorStopTitle")}
                        </strong>
                        {t("tokushoho.value.operatorStopBody")}
                      </li>
                      <li>
                        <strong>{t("tokushoho.value.severeBugTitle")}</strong>
                        {t("tokushoho.value.severeBugBody")}
                      </li>
                    </ul>
                  </div>
                </Row>
                <Row label={t("tokushoho.label.serviceContentLimit")}>
                  <div className="space-y-3">
                    <div className="text-sm sm:text-base">
                      <strong>
                        {t("tokushoho.value.serviceContentTitle")}
                      </strong>
                      {t("tokushoho.value.serviceContentBody")}
                    </div>
                    <div className="text-sm sm:text-base">
                      <strong>{t("tokushoho.value.serviceLimitTitle")}</strong>
                    </div>
                    <ul className="text-xs sm:text-sm space-y-2 list-disc pl-4">
                      <li>{t("tokushoho.value.serviceLimit1")}</li>
                      <li>{t("tokushoho.value.serviceLimit2")}</li>
                      <li>{t("tokushoho.value.serviceLimit3")}</li>
                      <li>{t("tokushoho.value.serviceLimit4")}</li>
                    </ul>
                  </div>
                </Row>
                <Row label={t("tokushoho.label.liabilityLimit")}>
                  <div className="space-y-3">
                    <div className="font-medium text-sm sm:text-base">
                      {t("tokushoho.value.liabilityLimitIntro")}
                    </div>
                    <ul className="text-xs sm:text-sm space-y-2 list-disc pl-4">
                      <li>{t("tokushoho.value.liability1")}</li>
                      <li>{t("tokushoho.value.liability2")}</li>
                      <li>{t("tokushoho.value.liability3")}</li>
                      <li>{t("tokushoho.value.liability4")}</li>
                      <li>{t("tokushoho.value.liability5")}</li>
                      <li>{t("tokushoho.value.liability6")}</li>
                    </ul>
                  </div>
                </Row>
                <Row label={t("tokushoho.label.contractChange")}>
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      <strong>{t("tokushoho.value.cancelByUserTitle")}</strong>
                      {t("tokushoho.value.cancelByUserBody")}
                    </div>
                    <div className="text-sm sm:text-base">
                      <strong>
                        {t("tokushoho.value.cancelByOperatorTitle")}
                      </strong>
                      {t("tokushoho.value.cancelByOperatorBody")}
                    </div>
                    <div className="text-sm sm:text-base">
                      <strong>{t("tokushoho.value.serviceChangeTitle")}</strong>
                      {t("tokushoho.value.serviceChangeBody")}
                    </div>
                    <div className="text-sm sm:text-base">
                      <strong>{t("tokushoho.value.priceChangeTitle")}</strong>
                      {t("tokushoho.value.priceChangeBody")}
                    </div>
                  </div>
                </Row>
                <Row label={t("tokushoho.label.governingLawCourt")}>
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      <strong>{t("tokushoho.value.governingLawTitle")}</strong>
                      {t("tokushoho.value.governingLawBody")}
                    </div>
                    <div className="text-sm sm:text-base">
                      <strong>{t("tokushoho.value.courtTitle")}</strong>
                      {t("tokushoho.value.courtBody")}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {t("tokushoho.value.disputeResolutionNote")}
                    </div>
                  </div>
                </Row>
                <Row label={t("tokushoho.label.other")}>
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      {t("tokushoho.value.other1")}
                    </div>
                    <div className="text-sm sm:text-base">
                      {t("tokushoho.value.other2")}
                    </div>
                    <div className="text-sm sm:text-base">
                      {t("tokushoho.value.other3")}
                    </div>
                  </div>
                </Row>
              </div>
            </div>
            <div className="text-right text-xs sm:text-sm text-neutral-600 mt-6 sm:mt-8">
              <p>{t("common.enactedAt")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
