"use client";

import { CtaButton } from "@/app/components/common/CtaButton";
import { motion } from "framer-motion";
import { ArrowDown, MapPin, Tag, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  // 背景画像のリスト
  const backgroundImages = [
    "https://images.pexels.com/photos/1322184/pexels-photo-1322184.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/15829427/pexels-photo-15829427.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/581344/pexels-photo-581344.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/10511496/pexels-photo-10511496.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);
  const featuresRef = useRef<HTMLElement>(null);

  // 「詳細を見る」ボタンクリック時の処理
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // 6秒ごとに画像を切り替え
    const interval = setInterval(() => {
      setIsChanging(true);
      setTimeout(() => {
        setCurrentImageIndex(
          (prevIndex) => (prevIndex + 1) % backgroundImages.length
        );
        setIsChanging(false);
      }, 500); // フェードアウト後に画像を切り替え
    }, 6000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <main>
      {/* Hero Section with Background Image */}
      <section className="relative px-4 pb-24 pt-16 sm:px-6 sm:pt-20 sm:pb-36 lg:px-8 overflow-hidden min-h-[85vh] sm:min-h-[100vh] flex items-center">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backgroundImages.map((src, index) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                currentImageIndex === index ? "opacity-100" : "opacity-0"
              } ${
                isChanging && currentImageIndex === index ? "opacity-30" : ""
              }`}
            >
              <Image
                src={src}
                alt={`背景 ${index + 1}`}
                fill
                style={{ objectFit: "cover" }}
                className="brightness-[0.8]"
                priority={index === 0}
              />
            </div>
          ))}
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
              カフェ、レストラン、ホテル、観光スポット...
              <br />
              気になる場所を保存して、大切な人と共有できます。
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-10 flex flex-col md:flex-row justify-center md:justify-start items-center md:items-stretch gap-4 flex-wrap"
            >
              <CtaButton type="login" />
              {/* PC 用ボタン */}
              <CtaButton type="sampleHero" />
              {/* SP 用リンク */}
              <Link
                href="/sample"
                className="md:hidden mt-2 text-center text-primary-400 underline"
              >
                サンプルを見る
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* 詳細を見るボタン - 背景画像の下部に配置 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20 cursor-pointer"
          onClick={scrollToFeatures}
        >
          <span className="text-white/90 text-sm mb-2 drop-shadow-md font-medium">
            詳細を見る
          </span>
          <ArrowDown className="h-6 w-6 text-white/90 animate-bounce drop-shadow-md" />
        </motion.div>
      </section>

      {/* Feature Section */}
      <section ref={featuresRef} className="py-16 bg-white relative">
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
              気になる場所を、
              <br />
              地図と一緒に共有
            </p>
            <p className="mt-6 max-w-2xl text-lg text-neutral-500 lg:mx-auto">
              カンタン操作で、お店やスポットをピンして、
              すぐにリストを共有できます。
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
                <div className="flow-root bg-neutral-50 rounded-xl px-6 pb-8 h-full transition-all duration-300 border border-neutral-100">
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
                      Googleマップ上で地点を検索するだけで行きたい場所をかんたん登録。タグやメモを追加して整理できます。
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
                <div className="flow-root bg-neutral-50 rounded-xl px-6 pb-8 h-full transition-all duration-300 border border-neutral-100">
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
                <div className="flow-root bg-neutral-50 rounded-xl px-6 pb-8 h-full transition-all duration-300 border border-neutral-100">
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
                      ジャンル、エリア、タグなどで絞り込み可能。行きたい場所をすぐに見つけられます。
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Section */}
      <section className="py-16 bg-gradient-to-b from-neutral-50 to-neutral-100 relative overflow-hidden">
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
              className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200"
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
              className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200"
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
              className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200"
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

      {/* Pricing Section */}
      <section className="py-16 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:text-center mb-20"
          >
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              料金プラン
            </h2>
            <p className="mt-2 text-3xl leading-8 font-bold text-neutral-900 sm:text-4xl md:text-5xl">
              あなたに合ったプランを選べます
            </p>
            <p className="mt-6 max-w-2xl text-lg text-neutral-500 lg:mx-auto">
              まずは無料で始めて、必要に応じてアップグレードできます。
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {/* フリープラン */}
            <div>
              <Card className="flex flex-col h-full border-primary-200 hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-neutral-700 mb-2">
                    フリープラン
                  </CardTitle>
                  <div className="text-3xl font-extrabold text-neutral-900 mb-1">
                    無料
                  </div>
                  <div className="text-sm text-neutral-500">ずっと0円</div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3 mt-2 border-t border-neutral-100 pt-4">
                  <ul className="space-y-3 text-neutral-700">
                    <li className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center mr-2">
                        <span className="text-neutral-600 text-xs">✓</span>
                      </div>
                      登録地点数：
                      <span className="font-semibold ml-1">10件/月まで</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center mr-2">
                        <span className="text-neutral-600 text-xs">✓</span>
                      </div>
                      広告表示：
                      <span className="font-semibold text-neutral-600 ml-1">
                        あり
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* ベーシックプラン - おすすめ */}
            <div>
              <Card className="flex flex-col h-full border-primary-400 shadow-lg ring-2 ring-primary-400 relative hover:shadow-2xl transition-all duration-300 z-10 scale-105">
                <div className="absolute -top-4 left-0 right-0 mx-auto w-max px-4 py-1 bg-primary-500 text-white text-sm font-bold rounded-full shadow-md">
                  おすすめ
                </div>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-primary-700 mb-2">
                    ベーシックプラン
                  </CardTitle>
                  <div className="text-3xl font-extrabold text-neutral-900 mb-1">
                    <span className="text-lg font-bold mr-2">月額</span>480円
                  </div>
                  <div className="text-sm text-neutral-500">コスパ重視</div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3 mt-2 border-t border-primary-300 pt-4">
                  <ul className="space-y-3 text-neutral-700">
                    <li className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center mr-2">
                        <span className="text-neutral-600 text-xs">✓</span>
                      </div>
                      登録地点数：
                      <span className="font-semibold ml-1">100件/月まで</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center mr-2">
                        <span className="text-neutral-600 text-xs">✓</span>
                      </div>
                      広告表示：
                      <span className="font-semibold text-neutral-600 ml-1">
                        なし
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* プレミアムプラン */}
            <div>
              <Card className="flex flex-col h-full border-yellow-400 hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-yellow-600 mb-2">
                    プレミアムプラン
                  </CardTitle>
                  <div className="text-3xl font-extrabold text-neutral-900 mb-1">
                    <span className="text-lg font-bold mr-2">月額</span>980円
                  </div>
                  <div className="text-sm text-neutral-500">
                    すべての機能を無制限で
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3 mt-2 border-t border-yellow-400 pt-4">
                  <ul className="space-y-3 text-neutral-700">
                    <li className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center mr-2">
                        <span className="text-neutral-600 text-xs">✓</span>
                      </div>
                      登録地点数：
                      <span className="font-semibold ml-1">上限なし</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center mr-2">
                        <span className="text-neutral-600 text-xs">✓</span>
                      </div>
                      広告表示：
                      <span className="font-semibold text-neutral-600 ml-1">
                        なし
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-neutral-100 to-neutral-200 relative overflow-hidden">
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
            <Link
              href="/sample"
              className="md:hidden mt-2 text-center underline"
            >
              サンプルを見る
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
