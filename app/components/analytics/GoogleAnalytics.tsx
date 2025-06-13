"use client";

import Script from "next/script";

// GA4 Measurement ID を環境変数から取得
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  // 本番環境でのみGAを有効化
  if (process.env.NODE_ENV !== "production" || !GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* Google Analytics Global Site Tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        async
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_title: document.title,
              page_location: window.location.href,
              // プライバシー設定
              anonymize_ip: true,
              allow_google_signals: false,
              allow_ad_personalization_signals: false
            });
          `,
        }}
      />
    </>
  );
}

// GAイベント送信用のヘルパー関数
export const sendGAEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// ページビュー送信用のヘルパー関数
export const sendPageView = (url: string, title?: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_title: title || document.title,
      page_location: url,
    });
  }
};

// TypeScript型定義を拡張
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}
