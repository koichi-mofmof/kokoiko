"use client";

import { CtaButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle, Heart, MapPin, Share2 } from "lucide-react";
import Image from "next/image";

export function CTASection() {
  const benefits = [
    {
      icon: CheckCircle,
      title: "無料で始められる",
      description: "基本機能は完全無料。すぐに使い始められます",
    },
    {
      icon: MapPin,
      title: "場所探しが簡単",
      description: "Google Maps検索で、お気に入りスポットを即座にリスト追加",
    },
    {
      icon: Share2,
      title: "大切な人と共有",
      description:
        "デートや旅行の計画に。共有リンクで、みんなで一緒にリストを作成・編集",
    },
    {
      icon: Heart,
      title: "思い出作りに最適",
      description: "タグ・コメント・ランキングで、あなただけの価値を整理",
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
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
        <div className="absolute inset-0 bg-primary-800/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 左側: メインCTA */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl mb-6">
              さあ、あなたの
              <span className="text-yellow-600">&quot;行きたい&quot;</span>
              を<br />
              地図にまとめましょう
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

          {/* 右側: メリットカード */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <Card className="h-full bg-white/90 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <benefit.icon className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                          {benefit.title}
                        </h3>
                        <p className="text-xs text-neutral-800 leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
