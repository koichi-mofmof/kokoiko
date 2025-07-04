"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trackConversionEvents } from "@/lib/analytics/events";
import { Heart, MapPin, PartyPopper, Plane, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface SignupPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: "default" | "mobile";
  listId?: string;
}

export function SignupPromptModal({
  isOpen,
  onClose,
  variant = "default",
  listId,
}: SignupPromptModalProps) {
  // ポップアップ表示時のGAイベント送信
  useEffect(() => {
    if (isOpen && listId) {
      trackConversionEvents.promptShown(listId);
    }
  }, [isOpen, listId]);

  // CTAクリック時のイベント処理
  const handleCtaClick = () => {
    if (listId) {
      trackConversionEvents.promptClicked(listId);
    }
    onClose();
  };

  // 閉じる時のイベント処理
  const handleClose = () => {
    if (listId) {
      trackConversionEvents.promptDismissed(listId);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`
          ${variant === "mobile" ? "w-[90%] max-w-[340px]" : "max-w-[380px]"}
          p-5
          bg-white
          border-0
          shadow-2xl
          rounded-2xl
          animate-in 
          fade-in-0 
          zoom-in-95
          duration-300
        `}
        onInteractOutside={handleClose}
      >
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 opacity-60 hover:opacity-100 transition-opacity z-10"
          aria-label="閉じる"
        >
          <X className="h-4 w-4 text-gray-500" />
          <span className="sr-only">閉じる</span>
        </button>

        {/* メインコンテンツ */}
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
                if (listId) {
                  trackConversionEvents.promptClicked(listId);
                }
                onClose();
              }}
            >
              すでにアカウントをお持ちの方はこちら
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
