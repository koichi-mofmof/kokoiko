import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "有効なメールアドレスを入力してください。" }),
  password: z
    .string()
    .min(8, { message: "パスワードは8文字以上で入力してください。" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message:
        "パスワードは英大文字、小文字、数字をそれぞれ1文字以上含める必要があります。",
    }),
});

export const signupSchema = z
  .object({
    email: z
      .string()
      .email({ message: "有効なメールアドレスを入力してください。" }),
    password: z
      .string()
      .min(8, { message: "パスワードは8文字以上で入力してください。" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, {
        message:
          'パスワードは英大文字、小文字、数字、記号(!@#$%^&*(),.?":{}|<>)をそれぞれ1文字以上含める必要があります。',
      }),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "利用規約とプライバシーポリシーへの同意が必要です。",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません。",
    path: ["confirmPassword"],
  });

// クライアントサイドバリデーション用スキーマ
export const passwordClientSchema = z
  .object({
    currentPassword: z // UI上残すがサーバーでは使用しない
      .string()
      .min(1, { message: "現在のパスワードを入力してください。" }),
    newPassword: z
      .string()
      .min(8, { message: "パスワードは8文字以上で入力してください。" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, {
        message:
          'パスワードは英大文字、小文字、数字、記号(!@#$%^&*(),.?":{}|<>)をそれぞれ1文字以上含める必要があります。',
      }),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "新しいパスワードは現在のパスワードと異なる必要があります。",
    path: ["newPassword"],
  });

// アカウント削除用バリデーションスキーマ
export const deleteAccountSchema = z.object({
  password: z.string().min(1, { message: "パスワードを入力してください。" }),
  confirmText: z.string().refine((val) => val === "削除", {
    message: "「削除」と入力してください。",
  }),
});
