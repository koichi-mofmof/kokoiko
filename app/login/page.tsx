import { LoginForm } from "@/app/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold">ログイン</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          メールアドレスまたはGoogleアカウントでログイン
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
