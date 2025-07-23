"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trackConversionEvents } from "@/lib/analytics/events";
import {
  Frown,
  Heart,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  PartyPopper,
  Plane,
  Smartphone,
  Smile,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SignupPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: "default" | "mobile";
  listId?: string;
}

// A/Bテスト用のバリアント定義
type ABTestVariant = "emotional" | "comparison";

export function SignupPromptModal({
  isOpen,
  onClose,
  variant = "default",
  listId,
}: SignupPromptModalProps) {
  // A/Bテスト用のバリアント決定（50%ずつ）
  const [abTestVariant, setAbTestVariant] = useState<ABTestVariant | null>(
    null
  );

  useEffect(() => {
    if (isOpen && !abTestVariant) {
      const randomValue = Math.random();
      const randomVariant: ABTestVariant =
        randomValue < 0.5 ? "emotional" : "comparison";
      setAbTestVariant(randomVariant);

      // A/Bテストのバリアント情報をGAに送信
      if (listId) {
        trackConversionEvents.promptShown(listId, randomVariant);
      }
    }
  }, [isOpen, listId, abTestVariant]);

  // CTAクリック時のイベント処理
  const handleCtaClick = () => {
    if (listId && abTestVariant) {
      trackConversionEvents.promptClicked(listId, abTestVariant);
    }
    onClose();
  };

  // 閉じる時のイベント処理
  const handleClose = () => {
    if (listId && abTestVariant) {
      trackConversionEvents.promptDismissed(listId, abTestVariant);
    }
    onClose();
  };

  if (!abTestVariant) {
    return null; // バリアントが決定されるまで表示しない
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`
          ${
            variant === "mobile"
              ? abTestVariant === "emotional"
                ? "w-[90%] max-w-[340px]"
                : "w-[85%] max-w-[360px]"
              : abTestVariant === "emotional"
              ? "max-w-[380px]"
              : "max-w-[425px]"
          }
          ${
            abTestVariant === "emotional"
              ? "p-5 bg-white border-0 shadow-2xl rounded-2xl animate-in fade-in-0 zoom-in-95 duration-300"
              : "max-h-[85vh] overflow-y-auto bg-white border shadow-lg rounded-lg p-6"
          }
        `}
        onInteractOutside={handleClose}
      >
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className={`absolute right-4 top-4 transition-opacity z-10 ${
            abTestVariant === "emotional"
              ? "opacity-60 hover:opacity-100"
              : "rounded-sm opacity-70 hover:opacity-100"
          }`}
          aria-label="閉じる"
        >
          <X
            className={`h-4 w-4 ${
              abTestVariant === "emotional" ? "text-gray-500" : ""
            }`}
          />
          <span className="sr-only">閉じる</span>
        </button>

        {abTestVariant === "emotional" ? (
          // 感情的デザイン（変更前）
          <div className="text-center space-y-5">
            {/* 魅力的なアイコンとエフェクト */}
            <div className="flex justify-center relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg relative">
                <MapPin className="h-8 w-8 text-white" />
                {/* キラキラエフェクト */}
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400" />
              </div>
            </div>

            {/* 簡潔で魅力的なタイトル */}
            <DialogTitle className="text-base font-bold text-neutral-800 leading-tight">
              恋人や友達と。
              <br />
              あなたも、
              <span className="font-extrabold text-primary-600">
                みんなで育てる場所リスト
              </span>
              を
              <br />
              作ってみませんか。
            </DialogTitle>

            {/* 機能説明セクション */}
            <div className="space-y-3 pt-2">
              <div className="space-y-2 text-sm text-neutral-800 font-medium rounded-lg p-4">
                {[
                  {
                    icon: Plane,
                    text: "旅行プランをリアルタイムで共同編集",
                  },
                  {
                    icon: PartyPopper,
                    text: "女子会で行きたいお店をピックアップ",
                  },
                  {
                    icon: Heart,
                    text: "共通の趣味の仲間とスポットを共有",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex animate-in fade-in-0 slide-in-from-top-2 duration-500 items-center gap-3"
                    style={{
                      animationDelay: `${index * 200 + 300}ms`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <item.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA部分 */}
            <div className="mt-6 space-y-3">
              {/* 簡単さアピール */}
              <p className="text-xs text-gray-500 text-center">
                登録は30秒 • 無料で試せる • いつでも退会OK
              </p>

              {/* メインCTAボタン */}
              <Link href="/signup" className="block">
                <Button
                  onClick={handleCtaClick}
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 transform"
                >
                  今すぐ始める
                </Button>
              </Link>

              {/* すでにアカウントを持っている場合のリンク */}
              <div className="text-center text-xs text-gray-500">
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-700 underline font-medium"
                  onClick={() => {
                    if (listId && abTestVariant) {
                      trackConversionEvents.promptClicked(
                        listId,
                        abTestVariant
                      );
                    }
                    onClose();
                  }}
                >
                  すでにアカウントをお持ちの方はこちら
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Before/After対比型デザイン（変更後）
          <>
            <div>
              <DialogTitle className="text-lg font-bold text-neutral-900 mb-2 text-center leading-relaxed">
                このリストを見ていて、
                <br />
                <span className="text-primary-600">「自分も作ってみたい」</span>
                と思いませんか？
              </DialogTitle>

              {/* サブタイトル */}
              <p className="text-sm text-neutral-800 mb-6 leading-relaxed">
                ClippyMapなら、「行きたい場所リスト」が簡単に作れます
              </p>

              <div className="space-y-4 mb-6">
                {/* Before - アイコン中心デザイン */}
                <div className="bg-neutral-100 border border-neutral-300 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-6 justify-center">
                    <Frown className="w-6 h-6 text-neutral-600" />
                    <span className="text-lg font-bold text-neutral-700">
                      よくあるお悩み
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center text-left bg-white rounded-lg p-3 text-neutral-700">
                      <Smartphone className="w-8 h-8 text-neutral-600 mb-2" />
                      <span className="font-medium text-xs leading-relaxed">
                        行きたい場所の情報が様々なアプリにバラバラ
                      </span>
                    </div>
                    <div className="flex flex-col items-center text-left bg-white rounded-lg p-3 text-neutral-700">
                      <MessageCircle className="w-8 h-8 text-neutral-600 mb-2" />
                      <span className="font-medium text-xs leading-relaxed">
                        友達に「今度ここ行こう!」と送ったリンクがLINEに埋もれる
                      </span>
                    </div>
                  </div>
                </div>

                {/* After - アイコン中心デザイン */}
                <div className="bg-primary-50 border-2 border-primary-300 rounded-xl p-5">
                  {/* サービスアイコンとタイトル */}
                  <div className="flex items-center gap-3 mb-6 justify-center">
                    <Smile className="w-6 h-6 text-primary-600" />
                    <span className="text-lg font-bold text-primary-700">
                      ClippyMapなら...
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center text-left p-3 bg-white rounded-lg">
                      <LinkIcon className="w-8 h-8 text-primary-600 mb-2" />
                      <span className="text-primary-800 font-medium text-xs leading-relaxed">
                        URLひとつで行きたい場所をまとめて管理
                      </span>
                    </div>
                    <div className="flex flex-col items-center text-left p-3 bg-white rounded-lg">
                      <Users className="w-8 h-8 text-primary-600 mb-2" />
                      <span className="text-primary-800 font-medium text-xs leading-relaxed">
                        友達と一緒にリストを編集
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA部分 */}
            <div className="space-y-4">
              <div className="p-1 bg-gradient-to-r from-primary-200 to-primary-300 rounded-xl">
                <Link href="/signup" className="block">
                  <Button
                    onClick={handleCtaClick}
                    className="w-full h-12 text-base font-bold shadow-lg"
                  >
                    今すぐ作ってみる（無料）
                  </Button>
                </Link>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-neutral-500 hover:text-neutral-700 underline"
                  onClick={() => {
                    if (listId && abTestVariant) {
                      trackConversionEvents.promptClicked(
                        listId,
                        abTestVariant
                      );
                    }
                    onClose();
                  }}
                >
                  既にアカウントをお持ちの方はこちら
                </Link>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
