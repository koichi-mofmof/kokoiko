"use client";

import { CtaButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SUBSCRIPTION_LIMITS } from "@/lib/constants/config/subscription";
import { motion } from "framer-motion";
import { ArrowDown, Check, Hash, MapPin, Share2, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
      <section className="relative px-4 pb-24 sm:px-6 sm:pt-20 sm:pb-36 lg:px-8 overflow-hidden min-h-[90svh] sm:min-h-[96svh] flex items-center">
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
            <p className="mt-6 text-sm md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto md:mx-0">
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

      {/* Example Section */}
      <section className="py-16 bg-gradient-to-b from-neutral-50 to-neutral-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:text-center mb-16"
          >
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              使用例
            </h2>
            <p className="mt-2 text-2xl sm:text-4xl leading-8 font-bold text-neutral-900">
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

      {/* User Voice Section */}
      <section className="py-16 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:text-center mb-16"
          >
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              ユーザーの声
            </h2>
            <p className="mt-2 text-2xl sm:text-4xl leading-8 font-bold text-neutral-900">
              みんなの体験談
            </p>
            <p className="mt-6 max-w-2xl sm:text-lg text-neutral-500 lg:mx-auto">
              実際に使っているユーザーの声をご紹介します。
            </p>
          </motion.div>

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
                  {/* T.K.さん */}
                  <CarouselItem key="tk" className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-2">
                      <Card className="flex flex-col h-60 shadow-md border border-neutral-200">
                        <CardHeader className="flex flex-row items-center gap-4 pt-6 pb-2">
                          <div className="rounded-full bg-primary-100 border border-primary-400 flex items-center justify-center w-12 h-12">
                            <User
                              className="text-primary-500 w-7 h-7"
                              aria-label="T.K.さんのアイコン"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-800">
                              T.K.さん
                            </div>
                            <div className="text-xs text-neutral-500">
                              会社員・カフェ巡り好き
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-2 pb-6 px-6">
                          <p className="text-neutral-700 text-sm">
                            友達同士で行きたいお店をリストアップし合えるので、
                            <span className="text-primary-600 font-bold">
                              ランチのお店決めがすごく楽に
                            </span>
                            なりました。
                            <br />
                            「次はここに行こうね！」とみんなでワクワクしながら計画しています。
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>

                  {/* M.S.さん */}
                  <CarouselItem key="ms" className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-2">
                      <Card className="flex flex-col h-60 shadow-md border border-neutral-200">
                        <CardHeader className="flex flex-row items-center gap-4 pt-6 pb-2">
                          <div className="rounded-full bg-primary-100 border border-primary-400 flex items-center justify-center w-12 h-12">
                            <User
                              className="text-primary-500 w-7 h-7"
                              aria-label="M.S.さんのアイコン"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-800">
                              M.S.さん
                            </div>
                            <div className="text-xs text-neutral-500">
                              看護師・デートプラン重視
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-2 pb-6 px-6">
                          <p className="text-neutral-700 text-sm">
                            行きたい場所をパートナーと一緒にリスト化して、
                            <span className="text-primary-600 font-bold">
                              デートの計画がとてもスムーズに
                            </span>
                            なりました。
                            <br />
                            「次はここに行こう！」と話し合うのが楽しいです。
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>

                  {/* Y.H.さん */}
                  <CarouselItem key="yh" className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-2">
                      <Card className="flex flex-col h-60 shadow-md border border-neutral-200">
                        <CardHeader className="flex flex-row items-center gap-4 pt-6 pb-2">
                          <div className="rounded-full bg-primary-100 border border-primary-400 flex items-center justify-center w-12 h-12">
                            <User
                              className="text-primary-500 w-7 h-7"
                              aria-label="Y.H.さんのアイコン"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-800">
                              Y.H.さん
                            </div>
                            <div className="text-xs text-neutral-500">
                              フリーランス・グルメブロガー
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-2 pb-6 px-6">
                          <p className="text-neutral-700 text-sm">
                            ブログで紹介したお店をリストにして公開したら、
                            <span className="text-primary-600 font-bold">
                              読者さんから「便利！」とコメント
                            </span>
                            をもらいました。
                            <br />
                            自分のおすすめを簡単にまとめられて助かっています。
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>

                  {/* K.A.さん */}
                  <CarouselItem key="ka" className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-2">
                      <Card className="flex flex-col h-60 shadow-md border border-neutral-200">
                        <CardHeader className="flex flex-row items-center gap-4 pt-6 pb-2">
                          <div className="rounded-full bg-primary-100 border border-primary-400 flex items-center justify-center w-12 h-12">
                            <User
                              className="text-primary-500 w-7 h-7"
                              aria-label="K.A.さんのアイコン"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-800">
                              K.A.さん
                            </div>
                            <div className="text-xs text-neutral-500">
                              大学生・旅行サークル所属
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-2 pb-6 px-6">
                          <p className="text-neutral-700 text-sm">
                            サークルの旅行計画で
                            <span className="text-primary-600 font-bold">
                              みんなの行きたい場所を集約できて
                            </span>
                            本当に助かりました。
                            <br />
                            「誰が何を提案したか分からない」問題がなくなりました。
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>

                  {/* R.T.さん */}
                  <CarouselItem key="rt" className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-2">
                      <Card className="flex flex-col h-60 shadow-md border border-neutral-200">
                        <CardHeader className="flex flex-row items-center gap-4 pt-6 pb-2">
                          <div className="rounded-full bg-primary-100 border border-primary-400 flex items-center justify-center w-12 h-12">
                            <User
                              className="text-primary-500 w-7 h-7"
                              aria-label="R.T.さんのアイコン"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-800">
                              R.T.さん
                            </div>
                            <div className="text-xs text-neutral-500">
                              主婦・子連れお出かけ情報収集
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-2 pb-6 px-6">
                          <p className="text-neutral-700 text-sm">
                            子連れOKのお店を「#子連れ」タグで整理して、
                            <span className="text-primary-600 font-bold">
                              ママ友との情報共有が楽になりました
                            </span>
                            。
                            <br />
                            どこが子連れに優しいか一目でわかるので重宝しています。
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>

                  {/* H.N.さん */}
                  <CarouselItem key="hn" className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-2">
                      <Card className="flex flex-col h-60 shadow-md border border-neutral-200">
                        <CardHeader className="flex flex-row items-center gap-4 pt-6 pb-2">
                          <div className="rounded-full bg-primary-100 border border-primary-400 flex items-center justify-center w-12 h-12">
                            <User
                              className="text-primary-500 w-7 h-7"
                              aria-label="H.N.さんのアイコン"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-800">
                              H.N.さん
                            </div>
                            <div className="text-xs text-neutral-500">
                              営業・出張多し
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-2 pb-6 px-6">
                          <p className="text-neutral-700 text-sm">
                            出張先で見つけた美味しいお店を記録して、
                            <span className="text-primary-600 font-bold">
                              同僚とのランチ選びで重宝
                            </span>
                            しています。
                            <br />
                            「あの時のお店どこだっけ？」がなくなりました。
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
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

      {/* Pricing Section */}
      <section className="py-16 bg-gradient-to-b from-neutral-50 to-neutral-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:text-center mb-16"
          >
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              料金プラン
            </h2>
            <p className="mt-2 text-2xl sm:text-4xl leading-8 font-bold text-neutral-900">
              あなたに合ったプランを選べます
            </p>
            <p className="mt-6 max-w-2xl text-sm sm:text-lg text-neutral-500 lg:mx-auto">
              まずは無料で始めて、必要に応じてアップグレードできます。
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 items-stretch">
            {/* フリープラン（無料） */}
            <div className="flex">
              <Card className="flex flex-col w-full border-neutral-200 hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center px-4 pt-9 pb-3 sm:px-6 sm:pt-10">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-neutral-700 mb-1 sm:mb-2">
                    フリープラン
                    <div className="mt-1 text-xs sm:text-sm text-neutral-500 font-normal">
                      まずはお試し
                    </div>
                  </CardTitle>
                  <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-0.5 sm:mb-1">
                    無料
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2 mt-2 border-t border-neutral-100 pt-4 pb-6 px-4 sm:px-6">
                  <ul className="space-y-2 text-sm text-neutral-700">
                    <li className="flex items-center">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                      登録地点数：
                      <span className="font-semibold ml-1">
                        毎月{SUBSCRIPTION_LIMITS.free.MAX_PLACES_PER_MONTH}
                        件まで
                      </span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-slate-400 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                      共有可能なリスト数：
                      <span className="font-semibold ml-1">
                        {SUBSCRIPTION_LIMITS.free.MAX_SHARED_LISTS}件まで
                      </span>
                    </li>
                    {/* <li className="flex items-center">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-slate-400 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                      広告表示：
                      <span className="font-semibold text-neutral-600 ml-1">
                        あり
                      </span>
                    </li> */}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* プレミアムプラン（有料） */}
            <div className="flex">
              <Card className="flex flex-col w-full border-primary-400 shadow-lg ring-2 ring-primary-400 relative hover:shadow-2xl transition-all duration-300">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-max px-3 py-0.5 bg-primary-500 text-white text-xs sm:text-sm font-bold rounded-full shadow-md">
                  おすすめ
                </div>
                <CardHeader className="text-center px-4 pt-9 pb-3 sm:px-6 sm:pt-10">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-primary-700 mb-1 sm:mb-2">
                    プレミアムプラン
                    <div className="mt-1 text-xs sm:text-sm text-neutral-500 font-normal">
                      すべての機能を無制限で
                    </div>
                  </CardTitle>
                  <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-0.5 sm:mb-1">
                    <span className="text-base sm:text-lg font-bold mr-2">
                      月額
                    </span>
                    500
                    <span className="text-base sm:text-lg font-bold ml-1">
                      円
                    </span>
                    <span className="text-xs ml-1">（税込）</span>
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-500">
                    または
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-0.5 sm:mb-1">
                    <div className="text-base text-neutral-500 text-center">
                      <span className="text-sm mr-2">年額</span>4,200
                      <span className="text-sm ml-1">円</span>
                      <span className="text-xs ml-1">（税込）</span>
                      <span className="text-xs ml-1">※1か月あたり350円</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2 mt-2 border-t border-primary-200 pt-4 pb-6 px-4 sm:px-6">
                  <ul className="space-y-2 text-sm text-neutral-700">
                    <li className="flex items-center">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                      登録地点数：
                      <span className="font-semibold ml-1">上限なし</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                      共有可能なリスト数：
                      <span className="font-semibold ml-1">無制限</span>
                    </li>
                    {/* <li className="flex items-center">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                      広告表示：
                      <span className="font-semibold text-neutral-600 ml-1">
                        なし
                      </span>
                    </li> */}
                    <li className="flex items-center">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                      14日間無料トライアル付き
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
