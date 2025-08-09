"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/use-i18n";

export function ExampleSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  // スクロール位置に基づいてアクティブなインデックスを更新
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const cardWidth = 320 + 16; // w-80 (320px) + gap (16px)
      const newIndex = Math.round(scrollLeft / cardWidth);

      setActiveIndex(Math.min(newIndex, 2)); // 最大2（3つのカード）
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // インジケータークリックでスクロール
  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = 320 + 16; // w-80 (320px) + gap (16px)
    container.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-16 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:text-center mb-16"
        >
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
            {t("home.examples.title")}
          </h2>
          <p className="mt-2 text-2xl sm:text-4xl leading-8 font-bold text-neutral-900">
            {t("home.examples.subtitle")}
          </p>
        </motion.div>

        {/* デスクトップ用：従来のグリッドレイアウト */}
        <div className="hidden md:grid grid-cols-1 gap-12 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200"
          >
            <div className="h-60 bg-primary-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src="https://images.pexels.com/photos/5086619/pexels-photo-5086619.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt={t("home.examples.card1.alt")}
                  fill
                  style={{ objectFit: "cover" }}
                  className="opacity-80 hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-semibold text-xl mb-3 text-neutral-900">
                {t("home.examples.card1.title")}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {t("home.examples.card1.desc")}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200"
          >
            <div className="h-60 bg-primary-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src="https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt={t("home.examples.card2.alt")}
                  fill
                  style={{ objectFit: "cover" }}
                  className="opacity-80 hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-semibold text-xl mb-3 text-neutral-900">
                {t("home.examples.card2.title")}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {t("home.examples.card2.desc")}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200"
          >
            <div className="h-60 bg-primary-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src="https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt={t("home.examples.card3.alt")}
                  fill
                  style={{ objectFit: "cover" }}
                  className="opacity-80 hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-semibold text-xl mb-3 text-neutral-900">
                {t("home.examples.card3.title")}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {t("home.examples.card3.desc")}
              </p>
            </div>
          </motion.div>
        </div>

        {/* モバイル用：横スクロールレイアウト */}
        <div className="md:hidden">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            ref={scrollContainerRef}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* カード1 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-shrink-0 w-80 snap-start"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200 h-full">
                <div className="h-48 bg-primary-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0">
                    <Image
                      src="https://images.pexels.com/photos/5086619/pexels-photo-5086619.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                      alt={t("home.examples.card1.alt")}
                      fill
                      style={{ objectFit: "cover" }}
                      className="opacity-80 hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-neutral-900">
                    {t("home.examples.card1.title")}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed text-sm">
                    {t("home.examples.card1.desc")}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* カード2 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0 w-80 snap-start"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200 h-full">
                <div className="h-48 bg-primary-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0">
                    <Image
                      src="https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                      alt={t("home.examples.card2.alt")}
                      fill
                      style={{ objectFit: "cover" }}
                      className="opacity-80 hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-neutral-900">
                    {t("home.examples.card2.title")}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed text-sm">
                    {t("home.examples.card2.desc")}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* カード3 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex-shrink-0 w-80 snap-start"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200 h-full">
                <div className="h-48 bg-primary-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0">
                    <Image
                      src="https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                      alt={t("home.examples.card3.alt")}
                      fill
                      style={{ objectFit: "cover" }}
                      className="opacity-80 hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-neutral-900">
                    {t("home.examples.card3.title")}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed text-sm">
                    {t("home.examples.card3.desc")}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* 動的スクロールインジケーター */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex justify-center mt-6 space-x-2"
          >
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "bg-primary-600 scale-125"
                    : "bg-neutral-300 hover:bg-neutral-400"
                }`}
                aria-label={t("home.examples.moveToCard", { index: index + 1 })}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
