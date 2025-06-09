import { Button } from "@/components/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookUser,
  HelpCircle,
  List,
  Share2,
  Sparkles,
  UserCircle,
} from "lucide-react";

export default function HelpPage() {
  const sections = [
    {
      icon: <UserCircle className="h-6 w-6" />,
      title: "アカウントについて",
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">ユーザー登録</h3>
            <p className="text-neutral-600">
              メールアドレスとパスワード、またはGoogleアカウントで簡単にユーザー登録ができます。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">ログイン・ログアウト</h3>
            <p className="text-neutral-600">
              登録した情報を使ってログインします。ヘッダーメニューからいつでもログアウトできます。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">パスワードの再設定</h3>
            <p className="text-neutral-600">
              パスワードを忘れた場合は、ログインページの「パスワードをお忘れですか？」リンクから再設定手続きを行ってください。
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: <List className="h-6 w-6" />,
      title: "リストの基本操作",
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">リストの作成</h3>
            <p className="text-neutral-600">
              マイリスト一覧ページから「新しいリストを作成」ボタンを押すと、リスト名を入力して新しいリストを作成できます。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">場所の追加</h3>
            <p className="text-neutral-600">
              リスト詳細ページで「場所を追加」ボタンを押し、キーワードで場所を検索してリストに追加します。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">場所の編集と管理</h3>
            <p className="text-neutral-600">
              追加した場所には、以下の情報を記録・編集できます。
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-neutral-600">
              <li>
                <strong>ユーザーコメント:</strong>{" "}
                その場所に関するメモや感想を残せます。
              </li>
              <li>
                <strong>タグ:</strong>{" "}
                「#カフェ」「#絶景」のようにタグを付けて分類できます。
              </li>
              <li>
                <strong>訪問ステータス:</strong>{" "}
                「訪問済」「未訪問」のステータスを管理できます。
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "便利な機能",
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">ランキング機能</h3>
            <p className="text-neutral-600">
              リスト内の場所をドラッグ＆ドロップで簡単に入れ替え、「行ってよかったランキング」「行きたい順ランキング」を作成できます。ランキングはいつでも編集可能です。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">マップとリストの表示切替</h3>
            <p className="text-neutral-600">
              リスト詳細ページでは、場所を地図上で確認できる「マップビュー」と、一覧で見る「リストビュー」をボタン一つで切り替えられます。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">絞り込み（フィルター）</h3>
            <p className="text-neutral-600">
              設定した「タグ」や「訪問ステータス」を使って、リスト内の場所を絞り込んで表示することができます。
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: "共有機能",
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">リストの公開設定</h3>
            <p className="text-neutral-600">
              リストは「公開」と「非公開」の2つの設定が選べます。
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-neutral-600">
              <li>
                <strong>公開リスト:</strong>{" "}
                リンクを知っている人なら誰でも閲覧できます。
                （共有相手がClippyMapのアカウントを持っている必要はありません。）
              </li>
              <li>
                <strong>非公開リスト:</strong>{" "}
                招待された共同編集者・閲覧者だけが編集・閲覧できます。
                （共有相手がClippyMapのアカウントを持っており、ログインする必要があります。）
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-1">共有方法</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-neutral-600">
              <li>
                <strong>リンクで共有:</strong>{" "}
                リスト詳細ページの「共有」ボタンから共有リンクを発行できます。公開リストの場合、このリンクを教えるだけで内容を共有できます。
              </li>
              <li>
                <strong>共同編集者として招待:</strong>{" "}
                共有リンクを相手にシェアすることで、非公開リストを共有し、一緒に編集することができます。
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const faqs = [
    {
      question: "サービスの利用は無料ですか？",
      answer: (
        <>
          <p className="mb-2">
            はい、基本的な機能は無料プランでご利用いただけます。
          </p>
          <p className="mb-2">
            無料プランでは共同編集者を招待できるリスト数や、1つのリストに登録できる場所の数に上限が設定されています。
          </p>
          <p className="mb-2">
            プレミアムプラン（月額500円または年額4,200円）にアップグレードすると、これらの制限が全てなくなり、無制限にリストや場所を登録できるようになります。
          </p>
        </>
      ),
    },
    {
      question: "非公開リストを特定の人とだけ共有したいのですが？",
      answer:
        "リスト詳細画面のメニュー（︙）からの共有設定で「共同リンクを発行」を選択し、共有したい相手に共有リンクをシェアしてください。共有相手の方がそのリンクを開くことで、非公開リストにアクセスできるようになります。",
    },
    {
      question: "タグや訪問ステータスは後から変更できますか？",
      answer:
        "はい、いつでも変更可能です。各場所のカードにある編集メニューから、登録済みのコメントやタグ、訪問ステータス（「訪問済」「未訪問」）を自由に編集できます。",
    },
    {
      question: "共同編集者と閲覧者の違いは何ですか？",
      answer:
        "非公開リストを共有する際に、権限を設定できます。「共同編集者」はリスト内の場所の追加や編集、削除ができますが、「閲覧者」はリストの閲覧のみが可能です。",
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
      answer:
        "はい、いつでも解約できます。設定ページの「サブスクリプション設定」から、簡単な手続きでサブスクリプションをキャンセルすることが可能です。契約期間の途中で解約された場合でも、期間終了までプレミアム機能をご利用いただけます。",
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
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-8">
        <header className="text-center mb-10"></header>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <BookUser className="h-6 w-6" />
              <CardTitle>はじめに</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                ClippyMapは、あなただけの「行きたい場所リスト」を簡単に作成・管理・共有できるサービスです。
                旅行の計画、デートスポットのメモ、お気に入りのカフェ巡りなど、様々なシーンでご活用いただけます。
              </p>
            </CardContent>
          </Card>

          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader className="flex flex-row items-center gap-3">
                {section.icon}
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>{section.content}</CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <HelpCircle className="h-6 w-6" />
              <CardTitle>よくあるご質問（FAQ）</CardTitle>
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
