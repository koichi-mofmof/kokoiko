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
  <div className="flex flex-col sm:table-row border-b border-neutral-100 last:border-b-0">
    <div className="sm:table-cell py-3 sm:py-2 pr-0 sm:pr-4 w-full sm:w-40 text-neutral-700 font-medium text-sm sm:text-base sm:align-top sm:whitespace-nowrap">
      <span className="block mb-1 sm:mb-0">{label}</span>
    </div>
    <div className="sm:table-cell py-0 sm:py-2 text-neutral-800 text-sm sm:text-base">
      {children}
    </div>
  </div>
);

export default function TokushohoPage() {
  return (
    <div className="bg-neutral-50 py-4 sm:py-8">
      <div className="max-w-3xl w-full mx-auto p-3 sm:p-4 md:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-neutral-100/80 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-neutral-600 flex-shrink-0" />
              <CardTitle className="text-lg sm:text-xl font-bold text-neutral-800 leading-tight">
                特定商取引法に基づく表記
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:table w-full sm:border-separate sm:border-spacing-y-1">
              <div className="sm:table-body">
                <Row label="販売業者の名称">
                  <span>市川恒太</span>
                </Row>
                <Row label="運営統括責任者">市川恒太</Row>
                <Row label="所在地">
                  <span className="text-sm text-neutral-600">
                    請求があったら遅滞なく電子メール等で開示します
                  </span>
                </Row>
                <Row label="電話番号">
                  <span className="text-sm text-neutral-600">
                    請求があったら遅滞なく電子メール等で開示します
                  </span>
                </Row>
                <Row label="お問い合わせ先">
                  <div className="space-y-3">
                    <div className="break-words">
                      <strong className="block sm:inline">
                        メールアドレス：
                      </strong>
                      <a
                        href="mailto:contact@clippymap.com"
                        className="text-blue-600 hover:underline mt-1 sm:mt-0 sm:ml-1 block sm:inline break-all"
                      >
                        clippymap@gmail.com
                      </a>
                    </div>
                    <div>
                      <Button
                        variant="secondary"
                        asChild
                        className="w-full sm:w-auto text-sm"
                      >
                        <a
                          href="https://forms.gle/vg9kMmdKiKxxN6EU6"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          お問い合わせフォームはこちら
                        </a>
                      </Button>
                    </div>
                    <div className="text-xs text-neutral-500">
                      お問い合わせへの回答は営業日の3営業日以内に行います
                    </div>
                  </div>
                </Row>
                <Row label="販売価格">
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      プレミアムプラン（月額）：500円（税込）
                    </div>
                    <div className="text-sm sm:text-base">
                      プレミアムプラン（年額）：4,200円（税込）
                    </div>
                    <div className="text-xs text-neutral-500">
                      ※価格は予告なく変更することがあります
                    </div>
                  </div>
                </Row>
                <Row label="追加手数料等の追加料金">
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      基本的に追加料金は発生しません
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-600">
                      ※クレジットカード決済手数料はサービス料金に含まれています
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-600">
                      ※消費税は表示価格に含まれています
                    </div>
                  </div>
                </Row>
                <Row label="支払い時期・方法">
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      クレジットカード決済（Stripe）による前払い
                    </div>
                    <div className="text-sm sm:text-base">
                      月額プラン：毎月の契約更新日に自動課金
                    </div>
                    <div className="text-sm sm:text-base">
                      年額プラン：毎年の契約更新日に自動課金
                    </div>
                    <div className="text-xs text-neutral-500">
                      ※決済はStripe Inc.が提供するシステムを使用します
                    </div>
                  </div>
                </Row>
                <Row label="サービス提供時期">
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      決済完了後、即時にプレミアム機能をご利用いただけます
                    </div>
                    <div className="text-xs text-neutral-500">
                      ※システム障害等により提供が遅れる場合があります
                    </div>
                  </div>
                </Row>
                <Row label="返品・キャンセル・返金">
                  <div className="space-y-3">
                    <div className="font-medium text-sm sm:text-base">
                      デジタルサービスの性質上、以下の通り取り扱います：
                    </div>
                    <ul className="text-xs sm:text-sm space-y-2 list-disc pl-4">
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
                  <div className="space-y-3">
                    <div className="text-sm sm:text-base">
                      <strong>提供内容：</strong>
                      場所情報の管理・共有サービス
                    </div>
                    <div className="text-sm sm:text-base">
                      <strong>利用制限：</strong>
                    </div>
                    <ul className="text-xs sm:text-sm space-y-2 list-disc pl-4">
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
                  <div className="space-y-3">
                    <div className="font-medium text-sm sm:text-base">
                      以下の場合、運営者は一切の責任を負いません：
                    </div>
                    <ul className="text-xs sm:text-sm space-y-2 list-disc pl-4">
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
                    <div className="text-sm sm:text-base">
                      <strong>利用者による解約：</strong>
                      いつでも可能（返金なし）
                    </div>
                    <div className="text-sm sm:text-base">
                      <strong>運営者による解約：</strong>
                      利用規約違反等の場合、即時解約可能
                    </div>
                    <div className="text-sm sm:text-base">
                      <strong>サービス内容の変更：</strong>
                      事前通知により変更可能
                    </div>
                    <div className="text-sm sm:text-base">
                      <strong>料金の変更：</strong>
                      30日前の事前通知により変更可能
                    </div>
                  </div>
                </Row>
                <Row label="準拠法・管轄裁判所">
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base">
                      <strong>準拠法：</strong>
                      日本法
                    </div>
                    <div className="text-sm sm:text-base">
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
                    <div className="text-sm sm:text-base">
                      本表記に記載のない事項は利用規約およびプライバシーポリシーに従います
                    </div>
                    <div className="text-sm sm:text-base">
                      消費者契約法その他の消費者保護法規が適用される場合があります
                    </div>
                    <div className="text-sm sm:text-base">
                      ご不明点は上記フォームよりお問い合わせください
                    </div>
                  </div>
                </Row>
              </div>
            </div>
            <div className="text-right text-xs sm:text-sm text-neutral-600 mt-6 sm:mt-8">
              <p>2025年6月12日 制定・施行</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
