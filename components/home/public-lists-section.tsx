"use client";

import { PublicListForHome } from "@/lib/dal/public-lists";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { PublicListCard } from "./public-list-card";

interface PublicListsSectionProps {
  publicLists: PublicListForHome[];
}

export function PublicListsSection({ publicLists }: PublicListsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // スクロール位置に基づいてアクティブなインデックスを更新
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const cardWidth = 320 + 16; // w-80 (320px) + gap (16px)
      const newIndex = Math.round(scrollLeft / cardWidth);

      setActiveIndex(Math.min(newIndex, publicLists.length - 1));
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [publicLists.length]);

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

  if (publicLists.length === 0) {
    return null; // データがない場合は表示しない
  }

  return (
    <section className="py-16 bg-neutral-50" data-testid="public-lists-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:text-center mb-16"
        >
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
            みんなのリスト
          </h2>
          <p className="mt-2 text-2xl sm:text-4xl leading-8 font-bold text-neutral-900">
            実際のリストをご紹介
          </p>
        </motion.div>

        {/* デスクトップ用：従来のグリッドレイアウト */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {publicLists.map((list, index) => (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <PublicListCard list={list} />
            </motion.div>
          ))}
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
            {publicLists.map((list, index) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-shrink-0 w-80 snap-start"
              >
                <PublicListCard list={list} />
              </motion.div>
            ))}
          </motion.div>

          {/* 動的スクロールインジケーター */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex justify-center mt-6 space-x-2"
          >
            {publicLists.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "bg-primary-600 scale-125"
                    : "bg-neutral-300 hover:bg-neutral-400"
                }`}
                aria-label={`カード ${index + 1} に移動`}
              />
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-center mt-10"
        >
          <Button variant="secondary" size="lg" asChild>
            <Link href="/public-lists">もっと見る</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
