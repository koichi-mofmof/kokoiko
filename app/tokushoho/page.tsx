import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui";

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <tr>
    <th className="text-left align-top py-2 pr-4 w-40 text-neutral-700 font-medium whitespace-nowrap">
      {label}
    </th>
    <td className="py-2 text-neutral-800">{children}</td>
  </tr>
);

export default function TokushohoPage() {
  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-neutral-100/80">
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-neutral-600" />
              <CardTitle className="text-2xl font-bold text-neutral-800">
                特定商取引法に基づく表記
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <table className="w-full text-sm border-separate border-spacing-y-1">
              <tbody>
                <Row label="事業者名">
                  <span>ClippyMap運営者</span>
                  <br />
                  <span className="text-xs text-neutral-500">
                    （氏名・住所・電話番号は、請求があれば遅滞なく電子メール等で開示します）
                  </span>
                </Row>
                <Row label="運営責任者">同上</Row>
                <Row label="所在地">同上</Row>
                <Row label="電話番号">同上</Row>
                <Row label="お問い合わせ先">
                  <Button variant="secondary" asChild>
                    <a
                      href="https://forms.gle/vg9kMmdKiKxxN6EU6"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      お問い合わせフォームはこちら
                    </a>
                  </Button>
                </Row>
                <Row label="販売価格">
                  <span>月額500円（税込）または年額4,200円（税込）</span>
                </Row>
                <Row label="支払い時期・方法">
                  <span>お申し込み時にクレジットカード決済（Stripe）</span>
                </Row>
                <Row label="サービス提供時期">
                  <span>決済完了後、即時にご利用いただけます</span>
                </Row>
                <Row label="返品・キャンセル">
                  <span>
                    サービスの性質上、返品・返金はお受けしておりません。
                    <br />
                    ただし、無料トライアル期間中の解約は料金が発生しません。
                  </span>
                </Row>
                <Row label="動作環境">
                  <span>
                    インターネット接続環境および最新のWebブラウザが必要です
                  </span>
                </Row>
                <Row label="その他">
                  <span>
                    その他ご不明点は上記フォームよりお問い合わせください
                  </span>
                </Row>
              </tbody>
            </table>
            <div className="text-right text-sm text-neutral-600 mt-8">
              <p>2025年6月9日 制定</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
