import { NextResponse } from "next/server";

export async function GET() {
  try {
    // CloudFlare Workersの環境変数から取得
    const delay = process.env.NEXT_PUBLIC_SIGNUP_PROMPT_DELAY_MS || "10000";

    return NextResponse.json({
      delay,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching signup prompt delay config:", error);

    // エラー時はデフォルト値を返す
    return NextResponse.json({
      delay: "10000",
      timestamp: new Date().toISOString(),
    });
  }
}
