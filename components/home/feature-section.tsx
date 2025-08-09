"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { motion } from "framer-motion";
import { Hash, Search, Share2, Star, User, Users } from "lucide-react";
import { forwardRef } from "react";

export const FeatureSection = forwardRef<HTMLElement>((props, ref) => {
  const { t } = useI18n();
  return (
    <section
      ref={ref}
      data-section="features"
      className="py-16 bg-white relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:text-center mb-16"
        >
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
            {t("home.features.title")}
          </h2>
          <p className="mt-2 text-2xl sm:text-4xl leading-8 font-bold text-neutral-900">
            {t("home.features.subtitle1")}
            <br />
            {t("home.features.subtitle2")}
          </p>
        </motion.div>

        {/* ビジュアル重視の機能紹介 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature 1: 検索とストック */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative group"
          >
            <Card className="bg-neutral-50 h-full border-2 border-primary-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                {/* ビジュアルヘッダー */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Search className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                {/* 視覚的なプロセス */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">
                        1
                      </span>
                    </div>
                    <div className="flex-1 h-2 bg-primary-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-500 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">
                        2
                      </span>
                    </div>
                    <div className="flex-1 h-2 bg-primary-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-500 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.8 }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">
                        3
                      </span>
                    </div>
                    <div className="flex-1 h-2 bg-primary-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-500 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 1.1 }}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-neutral-900 text-center mb-3">
                  {t("home.features.f1.title")}
                </h3>
                <p className="text-neutral-600 text-start text-sm">
                  {t("home.features.f1.desc1")}
                  <br />
                  {t("home.features.f1.desc2")}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature 2: 共有機能 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative group"
          >
            <Card className="bg-neutral-50 h-full border-2 border-primary-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                {/* ビジュアルヘッダー */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Share2 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                {/* 共有オプションの視覚化 */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-neutral-600" />
                    </div>
                    <span className="text-xs text-neutral-600">
                      {t("home.feature.share.private")}
                    </span>
                    <div className="w-6 h-6 bg-neutral-300 rounded-full flex items-center justify-center">
                      <Users className="h-3 w-3 text-neutral-700" />
                    </div>
                    <span className="text-xs text-neutral-600">
                      {t("home.feature.share.twoPeople")}
                    </span>
                    <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center">
                      <Users className="h-3 w-3 text-primary-600" />
                    </div>
                    <span className="text-xs text-neutral-600">
                      {t("home.feature.share.public")}
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <div className="flex items-center space-x-2">
                      <motion.div
                        className="w-2 h-2 bg-primary-500 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-primary-500 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.7,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-primary-500 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 1.4,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-neutral-900 text-center mb-3">
                  {t("home.features.f2.title")}
                </h3>
                <p className="text-neutral-600 text-start text-sm">
                  {t("home.features.f2.desc1")}
                  <br />
                  {t("home.features.f2.desc2")}
                  <br />
                  {t("home.features.f2.desc3")}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature 3: カスタマイズ機能 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative group"
          >
            <Card className="bg-neutral-50 h-full border-2 border-primary-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                {/* ビジュアルヘッダー */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Hash className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                {/* タグとランキングの視覚化 */}
                <div className="space-y-4 mb-6">
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      t("home.feature.customize.tag1"),
                      t("home.feature.customize.tag2"),
                      t("home.feature.customize.tag3"),
                    ].map((tag, index) => (
                      <motion.div
                        key={tag}
                        className="px-3 py-1 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full text-xs font-medium text-primary-700"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      >
                        {tag}
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.div
                        key={star}
                        className="w-4 h-4 text-yellow-500"
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.2, delay: 0.8 + star * 0.1 }}
                      >
                        <Star className="w-full h-full fill-current" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-neutral-900 text-center mb-3">
                  {t("home.features.f3.title")}
                </h3>
                <p className="text-neutral-600 text-center text-sm">
                  {t("home.features.f3.desc")}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

FeatureSection.displayName = "FeatureSection";
