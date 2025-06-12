import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie } from "lucide-react";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-2">
    <h2 className="text-xl font-semibold text-neutral-800">{title}</h2>
    <div className="text-neutral-700 space-y-2 leading-relaxed">{children}</div>
  </section>
);

export default function CookiesPage() {
  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-neutral-100/80">
            <div className="flex items-center gap-3">
              <Cookie className="h-7 w-7 text-neutral-600" />
              <CardTitle className="text-xl font-bold text-neutral-800">
                Cookieポリシー
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            <Section title="前文">
              <p>
                本ポリシーは、ClippyMap（以下「本サービス」といいます）が提供するウェブサイトおよびアプリケーションにおける、Cookie及び類似技術の使用について説明するものです。本サービスを利用することにより、ユーザーは本ポリシーに同意したものとみなされます。
              </p>
            </Section>

            <Section title="第1条（定義）">
              <p>本ポリシーにおいて使用する用語の定義は次のとおりです。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  「Cookie」とは、ウェブサイトを閲覧した際に、ウェブブラウザに保存される小さなテキストファイルをいいます。
                </li>
                <li>
                  「類似技術」とは、ローカルストレージ、セッションストレージ、ウェブビーコン、ピクセルタグその他の類似の技術をいいます。
                </li>
                <li>
                  「必須Cookie」とは、本サービスの基本機能の提供に不可欠なCookieをいいます。
                </li>
                <li>
                  「機能性Cookie」とは、ユーザーの利便性向上のために使用されるCookieをいいます。
                </li>
                <li>
                  「分析Cookie」とは、サービス利用状況の分析・改善のために使用されるCookieをいいます。
                </li>
              </ul>
            </Section>

            <Section title="第2条（Cookieの種類と利用目的）">
              <p>本サービスでは、以下の種類のCookieを利用しています。</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-neutral-800 mb-2">
                    1. 必須Cookie
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>認証Cookie:</strong>
                      ユーザーのログイン状態を安全に維持するために必要なCookie（Supabase
                      Auth）
                    </li>
                    <li>
                      <strong>セッション管理Cookie:</strong>
                      ユーザーのセッション情報を管理し、本サービスの基本機能を提供するためのCookie
                    </li>
                    <li>
                      <strong>セキュリティCookie:</strong>
                      CSRF攻撃防止、セキュリティ機能の実装に必要なCookie
                    </li>
                    <li>
                      <strong>負荷分散Cookie:</strong>
                      サーバー負荷分散、パフォーマンス最適化のためのCookie
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-neutral-800 mb-2">
                    2. 機能性Cookie
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>設定保存Cookie:</strong>
                      ユーザーの表示設定、言語設定等を保存するCookie
                    </li>
                    <li>
                      <strong>UI状態保存Cookie:</strong>
                      フォーム入力内容、画面表示状態等の一時保存
                    </li>
                    <li>
                      <strong>機能拡張Cookie:</strong>
                      本サービスの機能改善・拡張のためのCookie
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-neutral-800 mb-2">
                    3. 分析Cookie
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Google Analytics:</strong>
                      サービス利用状況の分析、改善のためのアクセス解析
                    </li>
                    <li>
                      <strong>パフォーマンス測定:</strong>
                      ページ読み込み速度、エラー発生状況等の監視
                    </li>
                    <li>
                      <strong>ユーザー行動分析:</strong>
                      匿名化されたユーザー行動データの収集・分析
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-neutral-800 mb-2">
                    4. 外部サービス連携Cookie
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>決済処理Cookie:</strong>
                      Stripeによる決済処理を安全に実行するためのCookie
                    </li>
                    <li>
                      <strong>OAuth認証Cookie:</strong>
                      Google等の外部サービス認証連携のためのCookie
                    </li>
                    <li>
                      <strong>地図サービスCookie:</strong>
                      OpenStreetMap、Google Maps等の地図機能提供のためのCookie
                    </li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section title="第3条（Cookieの管理・設定）">
              <p>
                1.
                ユーザーは、お使いのブラウザの設定を変更することで、Cookieの受け入れを制御することができます。
              </p>
              <p>2. ただし、以下の点にご注意ください。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  必須Cookieを無効化した場合、本サービスにログインできない、または正常に動作しない可能性があります。
                </li>
                <li>
                  機能性Cookieを無効化した場合、ユーザー設定が保存されない、利便性が低下する可能性があります。
                </li>
                <li>
                  分析Cookieを無効化した場合、サービス改善に支障が生じる可能性がありますが、基本機能の利用には影響しません。
                </li>
              </ul>
              <p>
                3.
                運営者は、本サービスの提供に必要な範囲で、ユーザーの同意なく必須Cookieを設置・利用することがあります。
              </p>
            </Section>

            <Section title="第4条（Cookie情報の利用・共有）">
              <p>1. 運営者は、収集したCookie情報を以下の目的で利用します。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>本サービスの提供・運営・保守・改善</li>
                <li>ユーザー認証・セッション管理</li>
                <li>セキュリティ機能の提供</li>
                <li>利用状況の分析・統計作成</li>
                <li>新機能の開発・提供</li>
                <li>不正利用の防止・検知</li>
                <li>技術的問題の診断・解決</li>
                <li>法令に基づく義務の履行</li>
              </ul>
              <p>
                2.
                運営者は、以下の場合にCookie情報を第三者と共有することがあります。
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Google Analytics等の分析サービスとの情報共有（匿名化済み）
                </li>
                <li>Stripe等の決済サービスとの必要な情報共有</li>
                <li>技術的問題の解決のための外部サービスとの情報共有</li>
                <li>法令に基づく開示要請への対応</li>
                <li>本サービスの運営に必要な業務委託先との情報共有</li>
              </ul>
            </Section>

            <Section title="第5条（保存期間）">
              <p>Cookieの保存期間は以下のとおりです。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>セッションCookie：ブラウザ終了時まで</li>
                <li>認証Cookie：最大1年間（自動更新あり）</li>
                <li>設定保存Cookie：最大2年間</li>
                <li>分析Cookie：最大2年間</li>
                <li>その他のCookie：各Cookieの目的に応じた合理的な期間</li>
              </ul>
              <p>
                運営者は、技術的制約、法令の要請、セキュリティ上の理由により、上記期間を変更することがあります。
              </p>
            </Section>

            <Section title="第6条（新技術への対応）">
              <p>
                運営者は、技術の進歩に応じて、Cookieに類似する新しい技術（ローカルストレージ、IndexedDB、Service
                Worker等）を導入することがあります。これらの技術についても、本ポリシーが適用されます。
              </p>
            </Section>

            <Section title="第7条（責任制限）">
              <p>
                1.
                運営者は、Cookie機能の利用により生じた損害について、運営者の故意または重過失による場合を除き、一切の責任を負いません。
              </p>
              <p>
                2.
                ユーザーがCookieを無効化することにより本サービスの機能に支障が生じた場合、運営者は一切の責任を負いません。
              </p>
              <p>
                3.
                第三者のCookieによる情報収集・利用については、当該第三者の責任となり、運営者は一切の責任を負いません。
              </p>
            </Section>

            <Section title="第8条（ポリシーの変更）">
              <p>
                1.
                運営者は、法令の変更、技術の進歩、事業内容の変更その他の事由により、本ポリシーを変更することがあります。
              </p>
              <p>
                2.
                本ポリシーの変更は、変更後のCookieポリシーを本サービス上に掲載した時点で効力を生じるものとします。
              </p>
              <p>
                3. 重要な変更については、適切な方法によりユーザーに通知します。
              </p>
            </Section>

            <Section title="第9条（準拠法・管轄裁判所）">
              <p>1. 本ポリシーの解釈・適用については、日本法に準拠します。</p>
              <p>
                2.
                本ポリシーに関して紛争が生じた場合は、東京簡易裁判所または東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </Section>

            <Section title="第10条（プライバシーポリシーとの関係）">
              <p>
                個人情報の取扱いについては、別途定める
                <a
                  href="/privacy"
                  className="text-blue-600 underline hover:text-blue-800 transition"
                >
                  プライバシーポリシー
                </a>
                をご確認ください。本ポリシーとプライバシーポリシーとの間に齟齬がある場合は、プライバシーポリシーが優先して適用されます。
              </p>
            </Section>

            <div className="text-right text-sm text-neutral-600 mt-8">
              <p>2025年6月12日 制定・施行</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
