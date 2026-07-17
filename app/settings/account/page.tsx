"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import {
  checkUserSubscriptionStatus,
  deleteUserAccount,
  updateUserPassword,
} from "@/lib/actions/auth";
import {
  passwordClientSchema,
} from "@/lib/validators/auth";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

// SubmitButtonコンポーネントを定義してpending状態をハンドリング
function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-primary-600 text-white hover:bg-primary-600/90 w-full sm:w-auto px-8"
    >
      {pending
        ? t("settings.account.processing")
        : t("settings.account.changePassword")}
    </Button>
  );
}

export default function AccountSettingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // const [userEmail, setUserEmail] = useState(""); // Server Action内で取得するため不要に
  const [clientValidationErrors, setClientValidationErrors] = useState<{
    currentPassword?: string[];
    newPassword?: string[];
  }>({});

  // アカウント削除用のstate
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // サブスクリプション状態管理
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean;
    subscriptionType?: string;
    subscriptionStatus?: string;
    message?: string;
    isWarningLevel?: boolean;
  } | null>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  const initialState = { success: false, message: "", errors: [] };
  const [state, formAction] = useActionState(updateUserPassword, initialState);
  const [deleteState, deleteFormAction] = useActionState(
    deleteUserAccount,
    initialState
  );

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: t("common.success"),
          description: state.messageKey ? t(state.messageKey) : state.message,
        });
        setCurrentPassword("");
        setNewPassword("");
        setClientValidationErrors({});
      } else {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: state.messageKey ? t(state.messageKey) : state.message,
        });
        if (state.errors) {
          const newErrors: {
            currentPassword?: string[];
            newPassword?: string[];
          } = {};
          state.errors.forEach((err) => {
            // Server ActionはnewPasswordフィールドのエラーのみ返す想定
            if (err.field === "newPassword") {
              newErrors[err.field] = [
                ...(newErrors[err.field] || []),
                err.message,
              ];
            }
          });
          setClientValidationErrors(newErrors);
        }
      }
    }
  }, [state, toast, t]);

  // アカウント削除処理のuseEffect（エラー時のみトースト。成功時はServer Actionでリダイレクト）
  useEffect(() => {
    if (deleteState.message && !deleteState.success) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: deleteState.messageKey
          ? t(deleteState.messageKey)
          : deleteState.message,
      });
    }
  }, [deleteState, toast, t]);

  const handleClientValidation = () => {
    setClientValidationErrors({});
    // バリデーションスキーマはcurrentPasswordを含むが、サーバーはnewPasswordのみ見る
    const validationResult = passwordClientSchema.safeParse({
      currentPassword,
      newPassword,
    });
    if (!validationResult.success) {
      setClientValidationErrors(validationResult.error.flatten().fieldErrors);
      return false;
    }
    return true;
  };

  // サブスクリプション状態を確認する関数
  const checkSubscriptionStatus = async () => {
    setIsCheckingSubscription(true);
    try {
      const status = await checkUserSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error("サブスクリプション確認エラー:", error);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        message: "サブスクリプション状態の確認に失敗しました。",
      });
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  // ダイアログが開かれた時にサブスクリプション状態を確認
  useEffect(() => {
    if (isDeleteDialogOpen && !subscriptionStatus) {
      checkSubscriptionStatus();
    }
  }, [isDeleteDialogOpen, subscriptionStatus]);

  const handleDeleteAccount = () => {
    // アクティブなサブスクリプションがある場合は警告
    if (subscriptionStatus?.hasActiveSubscription) {
      const statusMessage = subscriptionStatus.subscriptionStatus
        ? t("settings.account.subscription.statusWithState", {
            state: subscriptionStatus.subscriptionStatus,
          })
        : t("settings.account.subscription.label");

      toast({
        variant: "destructive",
        title: t("settings.account.subscription.cancelRequiredTitle"),
        description: t("settings.account.subscription.cancelRequiredDesc", {
          statusMessage,
        }),
      });
      return;
    }

    startTransition(() => {
      // 入力は不要。パラメータなしでサーバーアクションを呼び出す。
      deleteFormAction();
    });
  };

  return (
    <div className="space-y-6 px-0 sm:px-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.account.title")}</CardTitle>
          <CardDescription>{t("settings.account.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            action={(formData) => {
              if (!handleClientValidation()) return;
              const newFormData = new FormData();
              newFormData.append(
                "currentPassword",
                formData.get("currentPassword") as string
              );
              newFormData.append(
                "newPassword",
                formData.get("newPassword") as string
              );
              formAction(newFormData);
            }}
            className="space-y-4 max-w-full"
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className="block text-sm font-medium mb-1"
                >
                  {t("settings.account.currentPassword")}
                </label>
                <Input
                  id="current-password"
                  name="currentPassword" // nameは残すがサーバーでは利用しない
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full ${
                    clientValidationErrors.currentPassword ||
                    state?.errors?.some((e) => e.field === "currentPassword")
                      ? "border-red-500"
                      : ""
                  }`}
                  required // UI上は必須のまま
                />
                {clientValidationErrors.currentPassword?.map((error, index) => (
                  <p key={index} className="mt-1 text-sm text-red-500">
                    {t(error)}
                  </p>
                ))}
                {/* サーバーエラーも表示 */}
                {state?.errors
                  ?.filter((e) => e.field === "currentPassword")
                  .map((error, index) => (
                    <p
                      key={"server-" + index}
                      className="mt-1 text-sm text-red-500"
                    >
                      {t(error.message)}
                    </p>
                  ))}
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium mb-1"
                >
                  {t("settings.account.newPassword")}
                </label>
                <Input
                  id="new-password"
                  name="newPassword" // これがServer Actionに渡される
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full ${
                    clientValidationErrors.newPassword ? "border-red-500" : ""
                  }`}
                  required
                />
                {clientValidationErrors.newPassword?.map((error, index) => (
                  <p key={index} className="mt-1 text-sm text-red-500">
                    {t(error)}
                  </p>
                ))}
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("settings.account.passwordRule")}
                </p>
              </div>
            </div>

            <div className="flex justify-center sm:justify-end w-full">
              <SubmitButton />
            </div>
          </form>

          {/* アカウント削除セクション */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {t("settings.account.delete.warning")}
              </p>
            </div>

            <div className="flex justify-center sm:justify-end w-full">
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto px-8"
                  >
                    {t("settings.account.delete.button")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("settings.account.delete.confirmTitle")}
                    </AlertDialogTitle>
                  </AlertDialogHeader>

                  {/* サブスクリプション状態とその他の情報を AlertDialogHeader の外に配置 */}
                  <div className="space-y-3 py-2">
                    {/* サブスクリプション状態の表示 */}
                    {isCheckingSubscription && (
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">
                          {t("settings.account.subscription.checking")}
                        </p>
                      </div>
                    )}
                    {subscriptionStatus?.hasActiveSubscription && (
                      <div
                        className={`p-3 border rounded-md ${
                          subscriptionStatus.isWarningLevel
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <p
                          className={`text-sm font-medium ${
                            subscriptionStatus.isWarningLevel
                              ? "text-yellow-800"
                              : "text-red-800"
                          }`}
                        >
                          {subscriptionStatus.isWarningLevel ? "⚠️" : "🚫"}{" "}
                          {subscriptionStatus.subscriptionStatus
                            ? t("settings.account.subscription.hasWithState", {
                                state: subscriptionStatus.subscriptionStatus,
                              })
                            : t("settings.account.subscription.activePlan")}
                        </p>
                        <p
                          className={`text-xs sm:text-sm mt-1 ${
                            subscriptionStatus.isWarningLevel
                              ? "text-yellow-700"
                              : "text-red-700"
                          }`}
                        >
                          {t("settings.account.subscription.cancelInstruction")}
                          {subscriptionStatus.isWarningLevel && (
                            <span className="block mt-1 text-xs">
                              ※{t("settings.account.subscription.warningNote")}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {subscriptionStatus &&
                      !subscriptionStatus.hasActiveSubscription && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            {t("settings.account.subscription.none")}
                          </p>
                        </div>
                      )}
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800 font-medium">
                        {t("settings.account.delete.checklistTitle")}
                      </p>
                      <ul className="text-xs sm:text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                        <li>{t("settings.account.delete.item1")}</li>
                        <li>{t("settings.account.delete.item2")}</li>
                        <li>{t("settings.account.delete.item3")}</li>
                      </ul>
                    </div>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setSubscriptionStatus(null);
                      }}
                    >
                      {t("common.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={
                        isPending ||
                        isCheckingSubscription ||
                        subscriptionStatus?.hasActiveSubscription
                      }
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {isPending
                        ? t("common.deleting")
                        : subscriptionStatus?.hasActiveSubscription
                        ? t("settings.account.subscription.cancelFirst")
                        : isCheckingSubscription
                        ? t("common.checking")
                        : t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
