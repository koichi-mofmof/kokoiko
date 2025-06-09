import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

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

export default function TermsPage() {
  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-neutral-100/80">
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-neutral-600" />
              <CardTitle className="text-2xl font-bold text-neutral-800">
                利用規約
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            <Section title="前文">
              <p>
                この利用規約（以下「本規約」といいます）は、ClippyMap（以下「本サービス」といいます）の利用条件を定めるものです。ユーザーの皆様（以下「ユーザー」といいます）には、本規約に従って本サービスをご利用いただきます。
              </p>
            </Section>
            <Section title="第1条（適用）">
              <p>
                本規約は、ユーザーと運営者の間の本サービスの利用に関わる一切の関係に適用されます。
              </p>
            </Section>
            <Section title="第2条（利用登録）">
              <p>
                登録希望者が本規約に同意の上、運営者の定める方法によって利用登録を申請し、運営者がこれを承認することによって、利用登録が完了するものとします。
              </p>
            </Section>
            <Section title="第3条（ユーザーIDおよびパスワードの管理）">
              <p>
                ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。
              </p>
            </Section>
            <Section title="第4条（有料プラン）">
              <p>
                本サービスでは、基本機能を提供する無料プランの他に、追加機能を利用できる有料のプレミアムプランを提供します。プラン内容、料金、支払方法等の詳細については、サービス内の該当ページをご確認ください。
              </p>
              <p>
                ユーザーがプレミアムプランの利用料金の支払いを遅滞した場合、運営者は事前の通知なくサービスの利用を停止できるものとします。
              </p>
            </Section>
            <Section title="第5条（禁止事項）">
              <ul className="list-disc pl-5 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>
                  本サービスのサーバーやネットワークの機能を破壊したり、妨害したりする行為
                </li>
                <li>本サービスの運営を妨害するおそれのある行為</li>
                <li>他のユーザーの個人情報を収集または蓄積する行為</li>
                <li>他のユーザーに成りすます行為</li>
                <li>反社会的勢力に対して直接または間接に利益を供与する行為</li>
                <li>その他、運営者が不適切と判断する行為</li>
              </ul>
            </Section>
            <Section title="第6条（本サービスの提供の停止等）">
              <p>
                運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができます。
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  本サービスにかかるシステムの保守点検または更新を行う場合
                </li>
                <li>
                  地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合
                </li>
                <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
              </ul>
            </Section>
            <Section title="第7条（保証の否認および免責事項）">
              <p>
                運営者は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
              </p>
              <p>
                運営者は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。
              </p>
            </Section>
            <Section title="第8条（利用規約の変更）">
              <p>
                運営者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができます。
              </p>
            </Section>
            <Section title="第9条（個人情報の取扱い）">
              <p>
                本サービスの利用によって取得する個人情報については、運営者の定める「プライバシーポリシー」に従い適切に取り扱うものとします。
              </p>
            </Section>
            <Section title="第10条（準拠法・裁判管轄）">
              <p>
                本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、運営者の本店所在地を管轄する裁判所を専属的合意管轄とします。
              </p>
            </Section>
            <Section title="附則">
              <p className="text-sm">2025年6月9日 制定</p>
            </Section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
