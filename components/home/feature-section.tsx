"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { Hash, MapPin, Share2 } from "lucide-react";
import Image from "next/image";
import { forwardRef } from "react";

export const FeatureSection = forwardRef<HTMLElement>((props, ref) => {
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
            特徴
          </h2>
          <p className="mt-2 text-2xl sm:text-4xl leading-8 font-bold text-neutral-900">
            あなたの「行きたい」を、
            <br />
            もっと便利に、もっと楽しく
          </p>
          <p className="mt-6 max-w-2xl sm:text-lg text-neutral-500 lg:mx-auto">
            ClippyMapが提供する主な機能をご紹介します。
          </p>
        </motion.div>

        <div className="my-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col"
            >
              <div className="text-left sm:text-center">
                <div className="flex items-center justify-start gap-3 sm:justify-center">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-lg shadow-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900">
                    行きたい場所を、地図にストック
                  </h3>
                </div>
                <p className="mt-4 text-base text-neutral-600 leading-relaxed">
                  お店やスポットの名前で検索するだけ。Google
                  Mapsの情報をもとに、行きたい場所を簡単リストアップ。あなただけの「行きたい場所マップ」が、すぐに完成します。
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col"
            >
              <div className="text-left sm:text-center">
                <div className="flex items-center justify-start gap-3 sm:justify-center">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-lg shadow-lg">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900">
                    リストを、自在に共有
                  </h3>
                </div>
                <p className="mt-4 text-base text-neutral-600 leading-relaxed">
                  「二人だけのデートリスト」は共同編集で。「おすすめカフェリスト」はブログで一般公開。用途に合わせて、リストの共有範囲を変更できます。
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col"
            >
              <div className="text-left sm:text-center">
                <div className="flex items-center justify-start gap-3 sm:justify-center">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-lg shadow-lg">
                    <Hash className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900">
                    「わたしの基準」で、場所を整理
                  </h3>
                </div>
                <p className="mt-4 text-base text-neutral-600 leading-relaxed">
                  「#子連れOK」「#夜景が最高」といった自由なタグ付けや、お気に入りランキング作成。あなたのユニークな基準が、最高のガイドブックになります。
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full max-w-5xl mx-auto"
        >
          <div className="relative w-full max-w-5xl mx-auto">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {Array.from({ length: 4 }).map((_, index) => {
                  const imagePath = `/screenshots/feature${index + 1}.png`;
                  return (
                    <CarouselItem key={index} className="md:basis-1/2">
                      <div className="p-1">
                        <Card>
                          <CardContent className="flex h-64 sm:h-60 lg:h-96 items-center justify-center p-0 bg-neutral-50 rounded-lg border-neutral-200 overflow-hidden">
                            <Image
                              src={imagePath}
                              alt={`機能スクリーンショット ${index + 1}`}
                              width={1280}
                              height={960}
                              className="w-full h-full object-contain"
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="absolute -bottom-10 right-0 flex items-center gap-x-2">
                <CarouselPrevious className="static translate-y-0" />
                <CarouselNext className="static translate-y-0" />
              </div>
            </Carousel>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

FeatureSection.displayName = "FeatureSection";
