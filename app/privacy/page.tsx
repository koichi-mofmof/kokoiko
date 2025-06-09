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
              <CardTitle className="text-2xl font-bold text-neutral-800">
                プライバシーポリシー
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            <Section title="前文">
              <p>
                ClippyMap（以下「本サービス」といいます）は、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
              </p>
            </Section>
            <Section title="第1条（個人情報）">
              <p>
                「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、メールアドレス、その他の記述等により特定の個人を識別できる情報を指します。
              </p>
            </Section>
            <Section title="第2条（個人情報の収集方法）">
              <p>
                本サービスは、ユーザーが利用登録をする際にメールアドレスをお尋ねします。また、プレミアムプランのご利用にあたり、決済サービスStripeを通じてクレジットカード情報を収集します。加えて、本サービスの利用状況を把握するため、IPアドレスやユーザーエージェント、閲覧履歴などのアクセスログ情報を自動的に収集します。
              </p>
            </Section>
            <Section title="第3条（個人情報を収集・利用する目的）">
              <ul className="list-disc pl-5 space-y-1">
                <li>本サービスの提供・運営のため</li>
                <li>ユーザーからのお問い合わせに回答するため</li>
                <li>
                  メンテナンス、重要なお知らせなど必要に応じたご連絡のため
                </li>
                <li>
                  利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため
                </li>
                <li>有料プランの決済処理のため</li>
                <li>サービスの改善や新機能の開発のため</li>
                <li>上記の利用目的に付随する目的</li>
              </ul>
            </Section>
            <Section title="第4条（個人情報の第三者提供）">
              <p>
                本サービスは、法令に定める場合および決済代行会社（Stripe）への提供を除き、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供しません。
              </p>
            </Section>
            <Section title="第5条（アクセス解析ツールについて）">
              <p>
                本サービスでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。この規約に関して、詳しくは
                <a
                  href="https://marketingplatform.google.com/about/analytics/terms/jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 transition"
                >
                  こちら
                </a>
                をクリックしてください。
              </p>
            </Section>
            <Section title="第6条（個人情報の開示・訂正・削除）">
              <p>
                ユーザーは、運営者に対して自己の個人情報の開示、訂正、追加、削除、利用停止を求めることができます。ご希望の場合は、下記お問い合わせ窓口までご連絡ください。
              </p>
            </Section>
            <Section title="第7条（プライバシーポリシーの変更）">
              <p>
                本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
              </p>
            </Section>
            <Section title="第8条（お問い合わせ窓口）">
              <p>
                本ポリシーに関するお問い合わせは、下記のフォームよりお願いいたします。
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
              <p>2025年6月9日 制定</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
