"use client";

import { CtaButton } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { useI18n } from "@/hooks/use-i18n";

export function CTASection() {
  const { t } = useI18n();
  return (
    <section className="py-12 relative overflow-hidden border-2 sm:border-4 border-yellow-600 rounded-3xl mx-8 mb-8">
      {/* 背景画像とオーバーレイ */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.pexels.com/photos/592753/pexels-photo-592753.jpeg"
          alt={t("home.hero.backgroundAlt")}
          fill
          className="object-cover"
          priority
          quality={75}
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        <div className="absolute inset-0 bg-primary-700/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 items-center">
          {/* 左側: メインCTA */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl mb-6">
              {t("home.cta.line1")}
              <span className="text-yellow-600">{t("home.cta.highlight")}</span>
              <br />
              {t("home.cta.line2")}
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4"
            >
              <CtaButton type="login" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
