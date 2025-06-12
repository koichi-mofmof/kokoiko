import { Button } from "@/components/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export default function HelpPage() {
  const faqs = [
    {
      question: "サービスの利用は無料ですか？",
      answer: (
        <>
          <p className="mb-1">
            はい、基本的な機能は無料プランでご利用いただけます。
          </p>
          <p className="mb-1">
            ただし、無料プランでは登録できる場所の数や、共同編集者を招待できるリスト数に上限が設定されています。
          </p>
          <p className="mb-1">
            プレミアムプランにアップグレードすると、無制限に場所の登録や共同編集者の招待ができるようになります。
          </p>
        </>
      ),
    },
    {
      question: "非公開リストを特定の人とだけ共有したいのですが？",
      answer:
        "リスト詳細画面のメニュー（︙）から「共同編集者を招待」を押下し、「共有リンクを発行」してください。共有したい相手に共有リンクをシェアしてください。共有相手の方がそのリンクを開くことで、非公開リストにアクセスできるようになります。",
    },
    {
      question: "タグや訪問ステータスは後から変更できますか？",
      answer:
        "はい、いつでも変更可能です。各場所のカードにある編集メニューから、登録済みのコメントやタグ、訪問ステータス（「訪問済」「未訪問」）を自由に編集できます。",
    },
    {
      question: "共同編集者と閲覧者の違いは何ですか？",
      answer:
        "「共同編集者」はリスト内の場所の追加や編集、削除ができますが、「閲覧者」はリストの閲覧のみが可能です。",
    },
    {
      question: "間違えて追加した場所を削除するには？",
      answer:
        "場所カードのメニュー（︙）から「削除」を選択することで、リストからその場所を削除できます。",
    },
    {
      question: "プレミアムプランの支払い方法は何がありますか？",
      answer:
        "クレジットカードでのお支払いに対応しております。安全な決済システムであるStripeを通じて処理されますので、安心してご利用いただけます。",
    },
    {
      question: "プレミアムプランはいつでも解約できますか？",
      answer: (
        <>
          <p className="mb-1">はい、いつでも解約できます。</p>
          <p className="mb-1">
            設定ページの「サブスクリプション設定」から、簡単な手続きでサブスクリプションをキャンセルすることが可能です。
          </p>
          <p className="mb-1">
            契約期間の途中で解約された場合でも、期間終了までプレミアム機能をご利用いただけます。
          </p>
        </>
      ),
    },
    {
      question: "サービスに関する問い合わせ先はどこですか？",
      answer: (
        <>
          <p>
            不具合のご報告やご意見・ご要望は、下記のお問い合わせフォームよりお願いいたします。
          </p>
          <Button asChild variant="secondary" className="mt-3">
            <a
              href="https://forms.gle/vg9kMmdKiKxxN6EU6"
              target="_blank"
              rel="noopener noreferrer"
            >
              お問い合わせ
            </a>
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="bg-neutral-50">
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-8">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 bg-neutral-100/80 p-4">
              <HelpCircle className="h-6 w-6 text-neutral-600" />
              <CardTitle className="text-neutral-800 text-xl">
                よくあるご質問（FAQ）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-left font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 pt-2 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
