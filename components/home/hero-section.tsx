"use client";

import { CtaButton } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import Image from "next/image";

import { useEffect, useState, useMemo, useCallback } from "react";
// Framer Motion の必要な部分のみインポート
import { motion, type Variants } from "framer-motion";

// アニメーション定義を外部に移動してメモ化
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const fadeInWithDelay: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 0.9 },
};

export function HeroSection() {
  // 背景画像のリスト - 最初の2枚のみpreload、残りは遅延読み込み
  const backgroundImages = useMemo(
    () => [
      "https://images.pexels.com/photos/1322184/pexels-photo-1322184.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/15829427/pexels-photo-15829427.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/581344/pexels-photo-581344.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/10511496/pexels-photo-10511496.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    ],
    []
  );

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set([0])); // 最初の画像は読み込み済み

  // スクロール処理をメモ化
  const handleScrollToFeatures = useCallback(() => {
    const featuresSection = document.querySelector('[data-section="features"]');
    featuresSection?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    // 次の画像を事前に読み込み
    const preloadNextImage = (index: number) => {
      const nextIndex = (index + 1) % backgroundImages.length;
      if (!loadedImages.has(nextIndex)) {
        const img = new window.Image();
        img.src = backgroundImages[nextIndex];
        img.onload = () => {
          setLoadedImages((prev) => new Set([...prev, nextIndex]));
        };
      }
    };

    // 8秒ごとに画像を切り替え（少し長めに調整）
    const interval = setInterval(() => {
      setIsChanging(true);
      const nextIndex = (currentImageIndex + 1) % backgroundImages.length;

      // 次の画像を事前読み込み
      preloadNextImage(nextIndex);

      setTimeout(() => {
        setCurrentImageIndex(nextIndex);
        setIsChanging(false);
      }, 500);
    }, 8000);

    // 初期読み込み時に次の画像も読み込み
    preloadNextImage(currentImageIndex);

    return () => clearInterval(interval);
  }, [backgroundImages, currentImageIndex, loadedImages]);

  return (
    <section className="relative px-4 pb-24 sm:px-6 sm:pt-20 sm:pb-36 lg:px-8 overflow-hidden min-h-[90svh] sm:min-h-[96svh] flex items-center">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {backgroundImages.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentImageIndex === index ? "opacity-100" : "opacity-0"
            } ${isChanging && currentImageIndex === index ? "opacity-30" : ""}`}
          >
            <Image
              src={src}
              alt={`背景 ${index + 1}`}
              fill
              style={{ objectFit: "cover" }}
              className="brightness-[0.8]"
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
              sizes="100vw"
              quality={80}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.7 }}
          className="text-center md:text-left"
        >
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block mb-2">行きたい場所を</span>
            <span className="block text-primary-400 drop-shadow-md">
              あの人と共有
            </span>
          </h1>
          <p className="mt-6 text-sm md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto md:mx-0">
            カフェ、レストラン、ホテル、観光スポット...
            <br />
            気になる場所を保存して、大切な人と共有できます。
          </p>
          <motion.div
            variants={fadeInWithDelay}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-10 flex flex-col md:flex-row justify-center md:justify-start items-center md:items-stretch gap-4 flex-wrap"
          >
            <CtaButton type="login" />
          </motion.div>
        </motion.div>
      </div>

      {/* 詳細を見るボタン - 背景画像の下部に配置 */}
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20 cursor-pointer"
        onClick={handleScrollToFeatures}
      >
        <span className="text-white/90 text-sm mb-2 drop-shadow-md font-medium">
          詳細を見る
        </span>
        <ArrowDown className="h-6 w-6 text-white/90 animate-bounce drop-shadow-md" />
      </motion.div>
    </section>
  );
}
