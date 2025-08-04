"use client";

import { CtaButton } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

// アニメーション定義を外部に移動してメモ化
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 0.9 },
};

const tabVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// タブデータ
const tabs = [
  {
    id: "map",
    title: "マップ機能",
    description: "直感的な地図で、あなたの「行きたい」を視覚的に発見",
    image: "/screenshots/feature1.webp",
  },
  {
    id: "list",
    title: "リスト機能",
    description: "気になる場所を一覧で管理",
    image: "/screenshots/feature2.webp",
  },
  {
    id: "detail",
    title: "スポット詳細",
    description: "タグやコメントであなた流に整理",
    image: "/screenshots/feature3.webp",
  },
];

export function HeroSection() {
  const [activeTab, setActiveTab] = useState("map");

  return (
    <section className="relative px-4 pb-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col border-2 sm:border-4 border-yellow-600 rounded-3xl">
      {/* 背景画像とオーバーレイ */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.pexels.com/photos/592753/pexels-photo-592753.jpeg"
          alt="背景画像"
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

      {/* 上部コンテンツ - キャッチコピーとCTA */}
      <div className="max-w-5xl mx-auto w-full pt-4 sm:pt-12 pb-2">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <h1 className="text-3xl font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block mb-2 text-white drop-shadow-md">
              <span className="text-yellow-600">&quot;行きたい&quot;</span>が、
            </span>
            <span className="block text-white drop-shadow-md">
              地図でまとまる。
            </span>
          </h1>
        </motion.div>
      </div>

      {/* タブ切り替え機能 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="flex flex-col items-center justify-center"
      >
        {/* タブボタン */}
        <div className="flex flex-wrap justify-center gap-2 pt-4 sm:pt-8 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-white text-primary-700 shadow-lg scale-105"
                  : "bg-white/30 text-white hover:bg-white/40 border border-white/40 shadow-sm"
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        <div className="w-full max-w-4xl">
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              variants={tabVariants}
              initial="initial"
              animate={activeTab === tab.id ? "animate" : "exit"}
              transition={{ duration: 0.3 }}
              className={`${activeTab === tab.id ? "block" : "hidden"}`}
            >
              <div className="text-center">
                {/* スクリーンショット */}
                <div className="relative mx-auto w-[350px] h-[300px] sm:w-[730px] sm:h-[730px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm">
                  <Image
                    src={tab.image}
                    alt={`${tab.title}のスクリーンショット`}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    quality={75}
                    sizes="(max-width: 640px) 300px, (max-width: 1024px) 500px, 600px"
                  />
                </div>

                {/* 説明文 */}
                <div className="mt-4 text-center">
                  <p className="text-white/80 text-sm sm:text-base">
                    {tab.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTAボタン */}
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        transition={{ delay: 1.2, duration: 1 }}
        className="flex flex-col items-center pt-4 sm:pt-8 pb-4"
      >
        <CtaButton type="login" />
      </motion.div>
    </section>
  );
}
