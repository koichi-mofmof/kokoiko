"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_LIMITS } from "@/lib/constants/config/subscription";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export function PricingSection() {
  const { t } = useI18n();
  return (
    <section className="py-16 bg-neutral-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:text-center mb-16"
        >
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
            {t("home.pricing.title")}
          </h2>
          <p className="mt-2 text-2xl sm:text-4xl leading-8 font-bold text-neutral-900">
            {t("home.pricing.subtitle1")}
          </p>
          <p className="mt-6 max-w-2xl text-sm sm:text-lg text-neutral-500 lg:mx-auto">
            {t("home.pricing.subtitle2")}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 items-stretch">
          {/* フリープラン（無料） */}
          <div className="flex">
            <Card className="flex flex-col w-full border-neutral-200 hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center px-4 pt-9 pb-3 sm:px-6 sm:pt-10">
                <CardTitle className="text-xl sm:text-2xl font-bold text-neutral-700 mb-1 sm:mb-2">
                  {t("home.pricing.free.title")}
                  <div className="mt-1 text-xs sm:text-sm text-neutral-500 font-normal">
                    {t("home.pricing.free.badge")}
                  </div>
                </CardTitle>
                <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-0.5 sm:mb-1">
                  {t("home.pricing.free.price")}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-2 mt-2 border-t border-neutral-100 pt-4 pb-6 px-4 sm:px-6">
                <ul className="space-y-2 text-sm text-neutral-700">
                  <li className="flex items-center">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("home.pricing.free.limitPlacesLabel")}：
                    <span className="font-semibold ml-1">
                      {t("home.pricing.free.limitPlacesValue", {
                        n: SUBSCRIPTION_LIMITS.free.MAX_PLACES_TOTAL,
                      })}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-slate-400 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("home.pricing.free.limitSharedLabel")}：
                    <span className="font-semibold ml-1">
                      {t("home.pricing.free.limitSharedValue", {
                        n: SUBSCRIPTION_LIMITS.free.MAX_SHARED_LISTS,
                      })}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* プレミアムプラン（有料） */}
          <div className="flex">
            <Card className="flex flex-col w-full border-primary-400 shadow-lg ring-2 ring-primary-400 relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-max px-3 py-0.5 bg-primary-500 text-white text-xs sm:text-sm font-bold rounded-full shadow-md">
                {t("home.pricing.premium.recommended")}
              </div>
              <CardHeader className="text-center px-4 pt-9 pb-3 sm:px-6 sm:pt-10">
                <CardTitle className="text-xl sm:text-2xl font-bold text-primary-700 mb-1 sm:mb-2">
                  {t("home.pricing.premium.title")}
                  <div className="mt-1 text-xs sm:text-sm text-neutral-500 font-normal">
                    {t("home.pricing.premium.subtitle")}
                  </div>
                </CardTitle>
                <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-0.5 sm:mb-1">
                  <span className="text-base sm:text-lg font-bold mr-2">
                    {t("home.pricing.premium.monthlyLabel")}
                  </span>
                  500
                  <span className="text-base sm:text-lg font-bold ml-1">
                    {t("upgrade.price.currency")}
                  </span>
                  <span className="text-xs ml-1">
                    {t("home.pricing.taxIncluded")}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-neutral-500">
                  {t("home.pricing.or")}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-0.5 sm:mb-1">
                  <div className="text-base text-neutral-500 text-center">
                    <span className="text-sm mr-2">
                      {t("home.pricing.premium.yearlyLabel")}
                    </span>
                    4,200
                    <span className="text-sm ml-1">
                      {t("upgrade.price.currency")}
                    </span>
                    <span className="text-xs ml-1">
                      {t("home.pricing.taxIncluded")}
                    </span>
                    <span className="text-xs ml-1">
                      {t("upgrade.perMonthNote")}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-2 mt-2 border-t border-primary-200 pt-4 pb-6 px-4 sm:px-6">
                <ul className="space-y-2 text-sm text-neutral-700">
                  <li className="flex items-center">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("home.pricing.premium.limitPlacesLabel")}：
                    <span className="font-semibold ml-1">
                      {t("common.unlimited")}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("home.pricing.premium.limitSharedLabel")}：
                    <span className="font-semibold ml-1">
                      {t("common.unlimited")}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("upgrade.freeTrial")}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
