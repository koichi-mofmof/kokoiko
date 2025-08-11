import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "validation.auth.email.invalid" }),
  password: z
    .string()
    .min(8, { message: "validation.auth.password.min8" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "validation.auth.password.ruleSimple",
    }),
});

export const signupSchema = z
  .object({
    email: z.string().email({ message: "validation.auth.email.invalid" }),
    password: z
      .string()
      .min(8, { message: "validation.auth.password.min8" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, {
        message: "validation.auth.password.ruleStrong",
      }),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "validation.auth.terms.required",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.auth.password.mismatch",
    path: ["confirmPassword"],
  });

// クライアントサイドバリデーション用スキーマ
export const passwordClientSchema = z
  .object({
    currentPassword: z // UI上残すがサーバーでは使用しない
      .string()
      .min(1, { message: "validation.auth.password.current.required" }),
    newPassword: z
      .string()
      .min(8, { message: "validation.auth.password.min8" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, {
        message: "validation.auth.password.ruleStrong",
      }),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "validation.auth.password.newMustDiffer",
    path: ["newPassword"],
  });

// アカウント削除用バリデーションスキーマ
export const deleteAccountSchema = z.object({
  password: z.string().min(1, { message: "validation.auth.password.required" }),
  confirmText: z.string().refine((val) => val === "delete", {
    message: "validation.auth.delete.confirmWord",
  }),
});
