// Google Search Console の所有者確認用メタタグコンポーネント
const GSC_VERIFICATION_CODE = process.env.NEXT_PUBLIC_GSC_VERIFICATION_CODE;

export default function GoogleSearchConsole() {
  // 所有者確認コードが設定されていない場合は何も表示しない
  if (!GSC_VERIFICATION_CODE) {
    return null;
  }

  return (
    <meta name="google-site-verification" content={GSC_VERIFICATION_CODE} />
  );
}
