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
    <div className="bg-neutral-50 py-8">
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-neutral-100/80">
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-neutral-600" />
              <CardTitle className="text-xl font-bold text-neutral-800">
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
                    （氏名・住所・電話番号は、消費者からの請求があれば遅滞なく電子メール等で開示します）
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
                  <br />
                  <span className="text-xs text-neutral-500 mt-1 block">
                    お問い合わせへの回答は営業日の3営業日以内に行います
                  </span>
                </Row>
                <Row label="販売価格">
                  <div className="space-y-1">
                    <div>プレミアムプラン（月額）：500円（税込）</div>
                    <div>プレミアムプラン（年額）：4,200円（税込）</div>
                    <div className="text-xs text-neutral-500">
                      ※価格は予告なく変更することがあります
                    </div>
                  </div>
                </Row>
                <Row label="支払い時期・方法">
                  <div className="space-y-1">
                    <div>クレジットカード決済（Stripe）による前払い</div>
                    <div>月額プラン：毎月の契約更新日に自動課金</div>
                    <div>年額プラン：毎年の契約更新日に自動課金</div>
                    <div className="text-xs text-neutral-500">
                      ※決済はStripe Inc.が提供するシステムを使用します
                    </div>
                  </div>
                </Row>
                <Row label="サービス提供時期">
                  <div className="space-y-1">
                    <div>
                      決済完了後、即時にプレミアム機能をご利用いただけます
                    </div>
                    <div className="text-xs text-neutral-500">
                      ※システム障害等により提供が遅れる場合があります
                    </div>
                  </div>
                </Row>
                <Row label="返品・キャンセル・返金">
                  <div className="space-y-2">
                    <div className="font-medium">
                      デジタルサービスの性質上、以下の通り取り扱います：
                    </div>
                    <ul className="text-sm space-y-1 list-disc pl-4">
                      <li>
                        <strong>原則返金なし：</strong>
                        サービス利用開始後の返品・返金は一切行いません
                      </li>
                      <li>
                        <strong>無料トライアル：</strong>
                        初回利用者は14日間の無料期間があり、この期間中の解約は料金が発生しません
                      </li>
                      <li>
                        <strong>自動更新の停止：</strong>
                        いつでも自動更新を停止できますが、既に支払われた料金の返金はありません
                      </li>
                      <li>
                        <strong>運営者都合による停止：</strong>
                        運営者の都合によりサービスを停止する場合、未使用期間分の返金を行うことがあります（ただし義務ではありません）
                      </li>
                      <li>
                        <strong>重大な不具合：</strong>
                        運営者の故意または重過失により重大な不具合が生じ、サービスが全く利用できない状態が継続した場合のみ、個別に対応を検討します
                      </li>
                    </ul>
                  </div>
                </Row>
                <Row label="サービス内容・制限事項">
                  <div className="space-y-2">
                    <div>
                      <strong>提供内容：</strong>
                      場所情報の管理・共有サービス
                    </div>
                    <div>
                      <strong>利用制限：</strong>
                    </div>
                    <ul className="text-xs space-y-1 list-disc pl-4">
                      <li>
                        利用規約に違反した場合、予告なく利用停止することがあります
                      </li>
                      <li>
                        サーバー負荷軽減のため、一定の利用制限を設ける場合があります
                      </li>
                      <li>
                        外部サービス（Google
                        Maps等）の仕様変更により機能が制限される場合があります
                      </li>
                      <li>
                        メンテナンス・障害により一時的に利用できない場合があります
                      </li>
                    </ul>
                  </div>
                </Row>
                <Row label="責任の制限">
                  <div className="space-y-2">
                    <div className="font-medium">
                      以下の場合、運営者は一切の責任を負いません：
                    </div>
                    <ul className="text-xs space-y-1 list-disc pl-4">
                      <li>天災、停電、通信障害等の不可抗力による影響</li>
                      <li>
                        ユーザーの機器・ソフトウェア・ネットワーク環境による問題
                      </li>
                      <li>
                        外部サービス（Stripe、Google等）の障害・仕様変更による影響
                      </li>
                      <li>
                        ユーザーのデータ消失・情報漏洩（運営者の故意・重過失を除く）
                      </li>
                      <li>サービス利用による間接的・派生的損害</li>
                      <li>営業上の損失、機会損失、精神的損害</li>
                    </ul>
                  </div>
                </Row>
                <Row label="契約の解除・変更">
                  <div className="space-y-1">
                    <div>
                      <strong>利用者による解約：</strong>
                      いつでも可能（返金なし）
                    </div>
                    <div>
                      <strong>運営者による解約：</strong>
                      利用規約違反等の場合、即時解約可能
                    </div>
                    <div>
                      <strong>サービス内容の変更：</strong>
                      事前通知により変更可能
                    </div>
                    <div>
                      <strong>料金の変更：</strong>
                      30日前の事前通知により変更可能
                    </div>
                  </div>
                </Row>
                <Row label="準拠法・管轄裁判所">
                  <div className="space-y-1">
                    <div>
                      <strong>準拠法：</strong>
                      日本法
                    </div>
                    <div>
                      <strong>管轄裁判所：</strong>
                      東京簡易裁判所または東京地方裁判所
                    </div>
                    <div className="text-xs text-neutral-500">
                      紛争が生じた場合は、まず誠実な協議による解決を図ります
                    </div>
                  </div>
                </Row>
                <Row label="その他">
                  <div className="space-y-1">
                    <div>
                      本表記に記載のない事項は利用規約およびプライバシーポリシーに従います
                    </div>
                    <div>
                      消費者契約法その他の消費者保護法規が適用される場合があります
                    </div>
                    <div>ご不明点は上記フォームよりお問い合わせください</div>
                  </div>
                </Row>
              </tbody>
            </table>
            <div className="text-right text-sm text-neutral-600 mt-8">
              <p>2025年6月12日 制定・施行</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
