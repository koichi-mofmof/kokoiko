import Link from "next/link";
import Image from "next/image";

interface FooterProps {
  currentUser?: { id: string } | null;
}

export default function Footer({ currentUser }: FooterProps) {
  return (
    <footer className="bg-neutral-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/icon0.webp"
                  alt="ClippyMap icon"
                  width={24}
                  height={24}
                  className="filter brightness-0 invert"
                  priority
                />
                <span className="text-xl font-semibold font-quicksand text-neutral-100">
                  ClippyMap
                </span>
              </Link>
            </div>
            <p className="mt-2 text-sm text-neutral-400 max-w-md">
              デートや旅行の計画に。
              <br />
              &quot;行きたい場所&quot;をリスト化・共有できるサービスです。
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">
                サービス
              </h3>
              <div className="mt-4 space-y-2">
                <Link
                  href="/"
                  className="text-sm text-neutral-400 hover:text-white block"
                >
                  ホーム
                </Link>
                {currentUser && (
                  <>
                    <Link
                      href="/lists"
                      className="text-sm text-neutral-400 hover:text-white block"
                    >
                      マイリスト一覧
                    </Link>
                  </>
                )}
                <Link
                  href="/public-lists"
                  className="text-sm text-neutral-400 hover:text-white block"
                >
                  みんなのリスト
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">
                サポート
              </h3>
              <div className="mt-4 space-y-2">
                <Link
                  href="/help"
                  className="text-sm text-neutral-400 hover:text-white block"
                >
                  よくあるご質問
                </Link>
                <Link
                  href="https://forms.gle/vg9kMmdKiKxxN6EU6"
                  className="text-sm text-neutral-400 hover:text-white block"
                >
                  お問い合わせ
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-neutral-400 hover:text-white block"
                >
                  利用規約
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">
                法的情報
              </h3>
              <div className="mt-4 space-y-2">
                <Link
                  href="/privacy"
                  className="text-sm text-neutral-400 hover:text-white block"
                >
                  プライバシーポリシー
                </Link>
                <Link
                  href="/cookies"
                  className="text-sm text-neutral-400 hover:text-white block"
                >
                  Cookie ポリシー
                </Link>
                <Link
                  href="/tokushoho"
                  className="text-sm text-neutral-400 hover:text-white block"
                >
                  特定商取引法に基づく表記
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-700 pt-8">
          <p className="text-center text-neutral-400 text-sm">
            &copy; {new Date().getFullYear()} ClippyMap. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
