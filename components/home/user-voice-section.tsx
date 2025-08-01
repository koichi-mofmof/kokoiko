"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { User } from "lucide-react";

export function UserVoiceSection() {
  return (
    <section className="py-16 bg-neutral-50 relative">
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
          className="w-full max-w-7xl mx-auto"
        >
          <div className="relative w-full max-w-7xl mx-auto">
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
  );
}
