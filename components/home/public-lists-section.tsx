"use client";

import { PublicListForHome } from "@/lib/dal/public-lists";
import { motion } from "framer-motion";
import Link from "next/link";
import { PublicListCard } from "./public-list-card";
import { Button } from "../ui/button";

interface PublicListsSectionProps {
  publicLists: PublicListForHome[];
}

export function PublicListsSection({ publicLists }: PublicListsSectionProps) {
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
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 md:text-4xl">
            みんなが作った
            <span className="text-primary-600">おすすめスポット</span>
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            実際のユーザーが作成したリストをご紹介
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
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
        </motion.div>

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
