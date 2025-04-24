"use client";

import { ChevronRight, MapPin, Tag, Users, ArrowDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="pt-16">
      {/* Hero Section with Background Image */}
      <section className="relative px-4 py-24 sm:px-6 sm:py-36 lg:px-8 overflow-hidden min-h-[80vh] flex items-center">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="背景"
            fill
            style={{ objectFit: "cover" }}
            className="brightness-[0.8]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/50 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center md:text-left"
          >
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block mb-2">行きたい場所を</span>
              <span className="block text-primary-400 drop-shadow-md">
                あの人と共有
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto md:mx-0">
              カフェ、レストラン、古着屋、サウナ...
              <br />
              気になる場所をカンタンに保存して、大切な人と共有できます。
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-10 flex justify-center md:justify-start gap-4 flex-wrap"
            >
              <Button
                asChild
                variant="default"
                size="lg"
                className="shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              >
                <Link href="/map">
                  マイマップを作る
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-sm text-white border-white/20 shadow-lg hover:bg-white/20 hover:text-white hover:scale-105 transition-all duration-300"
              >
                <Link href="/login">ログイン</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:flex flex-col items-center mt-20"
          >
            <span className="text-white/80 text-sm mb-2">詳細を見る</span>
            <ArrowDown className="h-5 w-5 text-white/80 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:text-center mb-20"
          >
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              特徴
            </h2>
            <p className="mt-2 text-3xl leading-8 font-bold text-neutral-900 sm:text-4xl md:text-5xl">
              もっと簡単に、もっと楽しく
            </p>
            <p className="mt-6 max-w-2xl text-lg text-neutral-500 lg:mx-auto">
              カンタン操作で気になる場所を記録し、共有できます。
            </p>
          </motion.div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="pt-8 h-full"
              >
                <div className="flow-root bg-neutral-50 rounded-xl px-6 pb-8 h-full hover:shadow-lg transition-all duration-300 border border-neutral-100">
                  <div className="-mt-8">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-lg shadow-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-neutral-900">
                      かんたん登録
                    </h3>
                    <p className="mt-4 text-base text-neutral-600 leading-relaxed">
                      Google
                      MapsのURLを貼るだけで場所情報を自動取得。タグやメモを追加して整理できます。
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="pt-8 h-full"
              >
                <div className="flow-root bg-neutral-50 rounded-xl px-6 pb-8 h-full hover:shadow-lg transition-all duration-300 border border-neutral-100">
                  <div className="-mt-8">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-lg shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-neutral-900">
                      グループ共有
                    </h3>
                    <p className="mt-4 text-base text-neutral-600 leading-relaxed">
                      パートナーや友人と共有して、次に行きたい場所を一緒に計画しましょう。
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="pt-8 h-full"
              >
                <div className="flow-root bg-neutral-50 rounded-xl px-6 pb-8 h-full hover:shadow-lg transition-all duration-300 border border-neutral-100">
                  <div className="-mt-8">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-lg shadow-lg">
                        <Tag className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-neutral-900">
                      柔軟なフィルター
                    </h3>
                    <p className="mt-4 text-base text-neutral-600 leading-relaxed">
                      ジャンル、エリア、訪問予定日などで絞り込み可能。行きたい場所をすぐに見つけられます。
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Section */}
      <section className="py-24 bg-gradient-to-b from-neutral-50 to-neutral-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:text-center mb-20"
          >
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              使用例
            </h2>
            <p className="mt-2 text-3xl leading-8 font-bold text-neutral-900 sm:text-4xl md:text-5xl">
              こんな使い方ができます
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-neutral-200"
            >
              <div className="h-60 bg-primary-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0">
                  <Image
                    src="https://images.pexels.com/photos/5911145/pexels-photo-5911145.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                    alt="カップル"
                    fill
                    style={{ objectFit: "cover" }}
                    className="opacity-80 hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-semibold text-xl mb-3 text-neutral-900">
                  カップルで
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  「今度のデートはどこに行こう？」を解決。お互いが興味のある場所をリストアップして、週末の予定を立てやすくなります。
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-neutral-200"
            >
              <div className="h-60 bg-primary-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0">
                  <Image
                    src="https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                    alt="友人グループ"
                    fill
                    style={{ objectFit: "cover" }}
                    className="opacity-80 hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-semibold text-xl mb-3 text-neutral-900">
                  友人グループで
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  旅行計画やお出かけ先の候補を共有。「あのとき誰かが言ってた場所どこだっけ？」がなくなります。
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-neutral-200"
            >
              <div className="h-60 bg-primary-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0">
                  <Image
                    src="https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                    alt="個人利用"
                    fill
                    style={{ objectFit: "cover" }}
                    className="opacity-80 hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-semibold text-xl mb-3 text-neutral-900">
                  一人でも
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  SNSで見つけた気になるスポットや、あとで行きたいお店を整理。自分だけの行きたい場所コレクションを作れます。
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-neutral-100 to-neutral-200 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="https://images.pexels.com/photos/4429428/pexels-photo-4429428.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="地図背景"
            fill
            style={{ objectFit: "cover" }}
            className="opacity-10"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-4xl font-bold text-neutral-900 md:text-5xl">
            さあ、行きたい場所をマップに残してみましょう
          </h2>
          <p className="mt-6 text-xl text-neutral-600">
            完全無料でご利用いただけます。
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-10"
          >
            <Button
              asChild
              variant="default"
              size="lg"
              className="shadow-xl hover:shadow-2xl group hover:scale-105 transition-all duration-300"
            >
              <Link
                href="/map"
                className="inline-flex items-center text-lg px-10 py-6"
              >
                今すぐ始める
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
