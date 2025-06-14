"use client";

import { CtaButton } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-16 bg-white relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <h2 className="text-3xl font-bold text-neutral-900 md:text-5xl">
          さあ、<span className="text-primary-600">行きたい場所</span>を
          <br />
          リスト化してみましょう
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-10 flex flex-col md:flex-row justify-center items-center md:items-stretch gap-4 flex-wrap"
        >
          <CtaButton type="login" />
          {/* PC 用ボタン */}
          <CtaButton type="sampleCta" />
          {/* SP 用リンク */}
          <Link href="/sample" className="md:hidden mt-2 text-center underline">
            サンプルを見る
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
