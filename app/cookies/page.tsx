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
              <CardTitle className="text-2xl font-bold text-neutral-800">
                Cookieポリシー
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            <Section title="はじめに">
              <p>
                本ポリシーは、ClippyMap（以下「本サービス」といいます）が提供するウェブサイトにおける、Cookieの使用について説明するものです。
              </p>
            </Section>
            <Section title="Cookieとは">
              <p>
                Cookieとは、ウェブサイトを閲覧した際に、ウェブブラウザに保存される小さなテキストファイルのことです。これにより、ウェブサイトはユーザーの操作や設定（ログイン情報、言語、フォントサイズなど）を一定期間記憶し、再訪時に効率的に情報を表示することができます。
              </p>
            </Section>
            <Section title="Cookieの利用目的">
              <p>本サービスでは、以下の目的でCookieを利用しています。</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>認証のため:</strong>
                  ユーザーのログイン状態を安全に維持するために必須のCookieです（Supabase
                  Authにより発行）。
                </li>
                <li>
                  <strong>決済処理のため:</strong>
                  プレミアムプランの決済を安全に処理するためにStripeが発行するCookieです。
                </li>
                <li>
                  <strong>サービス改善のため:</strong>
                  Google
                  Analyticsを利用して、サービスの利用状況を分析し、機能改善に役立てています。
                </li>
                <li>
                  <strong>利便性向上のため:</strong>
                  ユーザーの表示設定などを保存し、次回のアクセスをよりスムーズにするために利用します。
                </li>
              </ul>
            </Section>
            <Section title="Cookieの管理方法">
              <p>
                ユーザーは、お使いのブラウザの設定を変更することで、Cookieの受け入れを拒否したり、保存されたCookieを削除したりすることができます。ただし、認証に必要なCookieを無効化した場合、本サービスにログインできなくなるなど、一部機能が正常にご利用いただけなくなる可能性がありますのでご注意ください。
              </p>
            </Section>
            <Section title="Cookieポリシーの変更">
              <p>
                本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。
              </p>
            </Section>
            <Section title="プライバシーポリシー">
              <p>
                個人情報の取扱いについては、別途定める
                <a
                  href="/privacy"
                  className="text-blue-600 underline hover:text-blue-800 transition"
                >
                  プライバシーポリシー
                </a>
                をご確認ください。
              </p>
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
