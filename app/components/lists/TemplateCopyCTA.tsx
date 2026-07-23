"use client";

import { TemplateCopyButton } from "@/app/components/lists/TemplateCopyButton";
import type { Place } from "@/types";

interface TemplateCopyCTAProps {
  /** 配置バリアント。スマホ=bottomBar、PC=desktopPill */
  variant: "bottomBar" | "desktopPill";
  sourceListId: string;
  sourceListName: string;
  places: Place[];
  isLoggedIn: boolean;
}

/**
 * 公開リストの目玉CTA「このリストをベースに自分用に編集」の配置バリアント。
 * 熱量ピーク（＝入口ではなく閲覧中）で押させる設計。いずれも常時表示。
 * - bottomBar:   スマホの追従ボトムバー（親指ゾーン、lg未満）
 * - desktopPill: PCの画面下中央に浮かぶ浮遊ピル（lg以上）
 *
 * 押させたい行動を1つに絞るため、コピーCTA単独で構成する
 * （ブックマークは実測でほぼ未使用のため本CTA面からは撤去。機能自体は存置）。
 * バリアントは表示ブレークポイントで排他（bottomBar=lg:hidden、desktopPill=hidden lg:block）。
 */
export function TemplateCopyCTA({
  variant,
  sourceListId,
  sourceListName,
  places,
  isLoggedIn,
}: TemplateCopyCTAProps) {
  const copyButton = (className?: string) => (
    <TemplateCopyButton
      sourceListId={sourceListId}
      sourceListName={sourceListName}
      places={places}
      isLoggedIn={isLoggedIn}
      className={className}
    />
  );

  // スマホ：追従ボトムバー（親指ゾーン・常時表示）。本命のコピーCTA一本。
  if (variant === "bottomBar") {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {copyButton("w-full sm:w-full")}
      </div>
    );
  }

  // PC：画面下中央に浮かぶ浮遊ピル（常時表示）。全幅バーの広告っぽさを避けつつ、
  // スマホと同じ「下に固定」の良さを踏襲する。
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 hidden justify-center px-4 lg:flex">
      <div className="pointer-events-auto">
        {copyButton(
          "sm:w-auto rounded-full px-6 py-6 text-base shadow-lg hover:shadow-xl"
        )}
      </div>
    </div>
  );
}
