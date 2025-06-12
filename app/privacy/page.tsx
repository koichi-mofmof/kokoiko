import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

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

export default function PrivacyPage() {
  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-neutral-100/80">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-neutral-600" />
              <CardTitle className="text-xl font-bold text-neutral-800">
                プライバシーポリシー
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            <Section title="前文">
              <p>
                ClippyMap（以下「本サービス」といいます）は、ユーザーの個人情報の取扱いについて、個人情報の保護に関する法律（個人情報保護法）その他関係法令等を遵守し、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。本サービスを利用することにより、ユーザーは本ポリシーに同意したものとみなされます。
              </p>
            </Section>

            <Section title="第1条（定義）">
              <p>本ポリシーにおいて使用する用語の定義は次のとおりです。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  「個人情報」とは、個人情報保護法に定める個人情報をいいます。
                </li>
                <li>
                  「個人データ」とは、個人情報保護法に定める個人データをいいます。
                </li>
                <li>
                  「保有個人データ」とは、個人情報保護法に定める保有個人データをいいます。
                </li>
                <li>
                  「運営者」とは、本サービスを運営する個人または法人をいいます。
                </li>
              </ul>
            </Section>

            <Section title="第2条（個人情報の収集方法）">
              <p>運営者は、以下の方法により個人情報を収集します。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  ユーザーが利用登録をする際の入力情報（メールアドレス、氏名等）
                </li>
                <li>外部サービス（Google等）を通じた認証時の提供情報</li>
                <li>
                  プレミアムプランのご利用にあたり、決済サービス（Stripe）を通じて収集する決済関連情報
                </li>
                <li>
                  本サービスの利用状況データ（IPアドレス、ユーザーエージェント、閲覧履歴、操作ログ等）
                </li>
                <li>
                  Cookie、ローカルストレージ等の技術を用いて自動的に収集される情報
                </li>
                <li>その他、本サービスの提供に必要な範囲で収集する情報</li>
              </ul>
            </Section>

            <Section title="第3条（個人情報を収集・利用する目的）">
              <p>運営者は、収集した個人情報を以下の目的で利用します。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>本サービスの提供・運営・保守・改善のため</li>
                <li>ユーザーの本人確認・認証のため</li>
                <li>ユーザーからのお問い合わせへの対応のため</li>
                <li>重要なお知らせ、メンテナンス情報等の通知のため</li>
                <li>利用規約違反者の特定・利用制限・法的措置のため</li>
                <li>有料プランの決済処理・課金管理のため</li>
                <li>サービス利用状況の分析・統計作成のため</li>
                <li>新機能・新サービスの開発・提供のため</li>
                <li>マーケティング・広告配信のため</li>
                <li>不正利用・セキュリティ事故の防止・対応のため</li>
                <li>法令に基づく義務の履行のため</li>
                <li>その他上記に付随する目的のため</li>
              </ul>
            </Section>

            <Section title="第4条（個人情報の第三者提供）">
              <p>
                1.
                運営者は、法令に定める場合を除き、ユーザーの同意を得ることなく、個人情報を第三者に提供しません。ただし、以下の場合はこの限りではありません。
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>決済代行会社（Stripe Inc.）への決済に必要な情報の提供</li>
                <li>
                  外部認証サービス（Google LLC等）との連携に必要な情報の提供
                </li>
                <li>
                  クラウドサービス（Supabase
                  Inc.等）への業務委託に伴う情報の提供
                </li>
                <li>
                  アクセス解析サービス（Google Analytics等）への統計情報の提供
                </li>
                <li>法令に基づく開示要請への対応</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>
                  公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合
                </li>
                <li>
                  国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合
                </li>
              </ul>
              <p>
                2.
                前項の規定にかかわらず、運営者は、本サービスの運営上必要と判断した場合、個人を特定できない形式に加工した統計データを第三者に提供することがあります。
              </p>
            </Section>

            <Section title="第5条（個人情報の保存期間）">
              <p>1. 運営者は、個人情報を以下の期間保存します。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>ユーザーアカウント情報：退会後5年間</li>
                <li>決済関連情報：法令で定められた期間（原則7年間）</li>
                <li>アクセスログ・操作ログ：収集から3年間</li>
                <li>お問い合わせ履歴：対応完了から3年間</li>
                <li>
                  その他の個人情報：収集から5年間または法令で定められた期間のいずれか長い期間
                </li>
              </ul>
              <p>
                2.
                前項にかかわらず、運営者は、法令の定めにより保存が義務付けられている場合、セキュリティ上の必要がある場合、紛争の予防・解決のために必要がある場合は、個人情報を相当期間保存することがあります。
              </p>
            </Section>

            <Section title="第6条（アクセス解析ツールについて）">
              <p>
                1.
                本サービスでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。Googleアナリティクスはトラフィックデータの収集のためにCookieを使用しており、このトラフィックデータは匿名で収集されています。
              </p>
              <p>
                2.
                この機能はCookieを無効にすることで収集を拒否することができますが、本サービスの機能の一部が正常に動作しなくなる可能性があります。
              </p>
              <p>
                3. Googleアナリティクスの利用規約については、
                <a
                  href="https://marketingplatform.google.com/about/analytics/terms/jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 transition"
                >
                  こちら
                </a>
                をご確認ください。
              </p>
            </Section>

            <Section title="第7条（個人情報の開示・訂正・削除等）">
              <p>
                1. ユーザーは、保有個人データについて、以下の権利を有します。
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>開示の請求</li>
                <li>内容の訂正、追加または削除の請求</li>
                <li>利用の停止または消去の請求</li>
                <li>第三者への提供の停止の請求</li>
              </ul>
              <p>
                2.
                前項の請求をする場合は、運営者所定の方法により本人確認を行った上で、合理的な期間内に対応します。ただし、以下の場合は請求に応じないことがあります。
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合
                </li>
                <li>
                  運営者の業務の適正な実施に著しい支障を及ぼすおそれがある場合
                </li>
                <li>法令に違反することとなる場合</li>
                <li>本人確認ができない場合</li>
              </ul>
              <p>
                3.
                開示等の請求に対応するために費用が発生する場合は、実費相当額をご負担いただくことがあります。
              </p>
            </Section>

            <Section title="第8条（個人情報の安全管理）">
              <p>
                1.
                運営者は、個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
              </p>
              <p>
                2.
                運営者は、個人情報の取扱いを委託する場合は、委託先について適切な監督を行います。
              </p>
              <p>
                3.
                万一、個人情報の漏洩等の事故が発生した場合は、速やかに事実関係を調査し、必要に応じて関係機関への届出、ユーザーへの通知等の措置を講じます。ただし、運営者の故意または重過失によらない個人情報の漏洩等については、運営者は一切の責任を負いません。
              </p>
            </Section>

            <Section title="第9条（個人情報保護責任者）">
              <p>
                運営者は、個人情報の適切な管理を実施するため、個人情報保護責任者を置きます。
              </p>
            </Section>

            <Section title="第10条（プライバシーポリシーの変更）">
              <p>
                1.
                運営者は、法令の変更、事業内容の変更その他の事由により、本ポリシーを変更することがあります。
              </p>
              <p>
                2.
                本ポリシーの変更は、変更後のプライバシーポリシーを本サービス上に掲載した時点で効力を生じるものとします。
              </p>
              <p>
                3. 重要な変更については、適切な方法によりユーザーに通知します。
              </p>
            </Section>

            <Section title="第11条（適用法令・管轄裁判所）">
              <p>1. 本ポリシーの解釈・適用については、日本法に準拠します。</p>
              <p>
                2.
                個人情報の取扱いに関して紛争が生じた場合は、東京簡易裁判所または東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </Section>

            <Section title="第12条（お問い合わせ窓口）">
              <p>
                本ポリシーに関するお問い合わせ、個人情報の開示等の請求については、下記のフォームよりお願いいたします。
              </p>
              <Button variant="secondary" asChild>
                <a
                  href="https://forms.gle/vg9kMmdKiKxxN6EU6"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  お問い合わせフォームはこちら
                </a>
              </Button>
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
