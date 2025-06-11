import { createClient } from "@/lib/supabase/server";
import { getSecurityStats } from "@/lib/utils/security-monitor";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 認証チェック（管理者のみアクセス可能）
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // セキュリティ統計情報を取得
    const stats = getSecurityStats();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
        monitoring: {
          status: "active",
          uptime: process.uptime(),
          version: "1.0.0",
        },
      },
    });
  } catch (error) {
    console.error("Security stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POSTは許可しない
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

// PUTは許可しない
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

// DELETEは許可しない
export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
