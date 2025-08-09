"use client";

import { UpgradePlanDialog } from "@/app/components/billing/UpgradePlanDialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "@/hooks/use-toast";
import {
  removeCollaboratorFromSharedList,
  updateCollaboratorPermissionOnSharedList,
} from "@/lib/actions/lists";
import {
  deleteShareLinkAction,
  updateShareLinkAction,
} from "@/lib/actions/share-actions";
import { Collaborator, ListForClient } from "@/lib/dal/lists";
import type { Database } from "@/types/supabase";
import { CheckCircle2, Copy, Info, Share2, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { DeleteShareLinkDialog } from "./DeleteShareLinkDialog";
import { EditShareLinkDialog } from "./EditShareLinkDialog";

export function ShareSettingsDialog({
  isOpen,
  onClose,
  list,
  links,
  loading,
  error,
  onCreateLink,
  onReloadLinks,
  onReloadCollaborators,
  isCreatingLink,
}: {
  isOpen: boolean;
  onClose: () => void;
  list: ListForClient;
  links: Partial<Database["public"]["Tables"]["list_share_tokens"]["Row"]>[];
  loading: boolean;
  error: string | null;
  onCreateLink: (
    formData: FormData,
    reset?: () => void
  ) => Promise<
    | {
        success: boolean;
        error?: string;
        upgradeRecommended?: boolean;
        sharedListNames?: string[];
      }
    | { success: false; error: string }
  >;
  onReloadLinks: () => Promise<void>;
  onReloadCollaborators: () => Promise<void>;
  isCreatingLink: boolean;
}) {
  const { refreshSubscription } = useSubscription();
  const { t } = useI18n();
  // フォームリセット用ref
  const formRef = React.useRef<HTMLFormElement>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  // 編集・削除の対象を一元管理
  const [editTarget, setEditTarget] = useState<Partial<
    Database["public"]["Tables"]["list_share_tokens"]["Row"]
  > | null>(null);
  const [editPermission, setEditPermission] = useState<"view" | "edit">("view");
  const [editActive, setEditActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Partial<
    Database["public"]["Tables"]["list_share_tokens"]["Row"]
  > | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // 共有メンバーごとの状態を一括管理
  const [memberStates, setMemberStates] = React.useState<
    Record<
      string,
      {
        localPermission: string;
        loading: boolean;
        showConfirm: boolean;
        permissionChanged: boolean;
      }
    >
  >({});
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // collaboratorsが変わるたびに初期化
  useEffect(() => {
    const initialStates: Record<
      string,
      {
        localPermission: string;
        loading: boolean;
        showConfirm: boolean;
        permissionChanged: boolean;
      }
    > = {};
    list.collaborators.forEach((member: Collaborator) => {
      initialStates[member.id] = {
        localPermission: member.permission || "view",
        loading: false,
        showConfirm: false,
        permissionChanged: false,
      };
    });
    setMemberStates(initialStates);
  }, [list.collaborators]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await onCreateLink(formData, () => {
      formRef.current?.reset();
    });
    if (
      result &&
      typeof result === "object" &&
      "upgradeRecommended" in result &&
      result.upgradeRecommended
    ) {
      setShowUpgradeDialog(true);
    }
  };

  // 編集開始
  const handleEdit = (
    link: Partial<Database["public"]["Tables"]["list_share_tokens"]["Row"]>
  ) => {
    setEditTarget(link);
    setEditPermission(link.default_permission ?? "view");
    setEditActive(link.is_active ?? true);
  };
  // 編集保存
  const handleEditSave = async () => {
    setEditLoading(true);
    const res = await updateShareLinkAction({
      id: editTarget?.id ?? "",
      default_permission: editPermission,
      is_active: editActive,
    });
    setEditLoading(false);
    if (res.success) {
      setEditTarget(null);
      await onReloadLinks();
      toast({ title: t("lists.share.updated") });
      await refreshSubscription();
    } else {
      toast({
        title: t("lists.share.updateFailed"),
        description: res.error || t("common.unexpectedError"),
        variant: "destructive",
      });
    }
  };
  // 削除開始
  const handleDelete = (
    link: Partial<Database["public"]["Tables"]["list_share_tokens"]["Row"]>
  ) => {
    setDeleteTarget(link);
  };
  // 削除確定
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    const res = await deleteShareLinkAction(deleteTarget?.id ?? "");
    setDeleteLoading(false);
    if (res.success) {
      setDeleteTarget(null);
      await onReloadLinks();
      toast({ title: t("lists.share.deleted") });
      await refreshSubscription();
    } else {
      toast({
        title: t("lists.share.deleteFailed"),
        description: res.error || t("common.unexpectedError"),
        variant: "destructive",
      });
    }
  };

  // 権限の変更を保存
  const handleSavePermission = async (memberId: string) => {
    setMemberStates((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], loading: true },
    }));
    const res = await updateCollaboratorPermissionOnSharedList({
      listId: list.id,
      targetUserId: memberId,
      newPermission: memberStates[memberId].localPermission as "view" | "edit",
    });
    setMemberStates((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        loading: false,
        permissionChanged: false,
      },
    }));
    if (res.success) {
      toast({ title: t("lists.share.permissionChanged") });
      await onReloadCollaborators();
      await refreshSubscription();
    } else {
      toast({
        title: t("lists.share.permissionChangeFailed"),
        description: res.error || t("common.unexpectedError"),
        variant: "destructive",
      });
    }
  };

  // メンバーを削除
  const handleRemove = async (memberId: string) => {
    setMemberStates((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], loading: true },
    }));
    const res = await removeCollaboratorFromSharedList({
      listId: list.id,
      targetUserId: memberId,
    });
    setMemberStates((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        loading: false,
        showConfirm: false,
      },
    }));
    if (res.success) {
      toast({ title: "共有を解除しました" });
      await onReloadCollaborators();
      await refreshSubscription();
    } else {
      toast({
        title: "共有解除に失敗しました",
        description: res.error || "エラーが発生しました",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-md sm:max-w-[425px] p-4 sm:p-6 max-h-[90dvh] overflow-y-auto"
        style={{ boxSizing: "border-box" }}
        onClick={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("lists.share.inviteTitle")}</DialogTitle>
        </DialogHeader>
        {/* 新規共有リンク発行フォーム */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-2"
        >
          <input type="hidden" name="listId" value={list.id} />
          <div className="flex flex-row items-center gap-x-4">
            <label className="block text-sm font-medium">
              {t("lists.share.permissionLabel")}
            </label>
            <RadioGroup
              defaultValue="view"
              name="permission"
              className="flex flex-row gap-4"
            >
              <div className="flex items-center gap-1">
                <RadioGroupItem value="view" id="permission-view" />
                <label htmlFor="permission-view" className="text-sm">
                  {t("lists.share.permission.viewOnly")}
                </label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="edit" id="permission-edit" />
                <label htmlFor="permission-edit" className="text-sm">
                  {t("lists.share.permission.editAndView")}
                </label>
              </div>
            </RadioGroup>
          </div>
          <Button
            type="submit"
            className="mt-4 w-full"
            disabled={isCreatingLink}
          >
            {t("lists.share.issueLink")}
          </Button>
        </form>
        {showUpgradeDialog && (
          <div className="mt-4 mb-2 flex flex-col items-center">
            <div className="w-full max-w-md bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex flex-col items-center text-center shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Info className="w-6 h-6 text-primary-500 mr-2" />
                <span className="font-semibold text-yellow-900 text-base">
                  {t("lists.share.limitReached.title")}
                </span>
              </div>
              <div className="text-sm text-yellow-900 mb-3 text-left">
                <span>
                  {t("lists.share.limitReached.freePlanLimit", { n: 1 })}
                </span>
                <div className="mt-2">
                  <span className="font-semibold text-primary-700"></span>
                  {t("lists.share.limitReached.upgradeHint")}
                </div>
              </div>
              <UpgradePlanDialog
                trigger={
                  <Button
                    variant="default"
                    className="w-full max-w-xs mt-1"
                    onClick={() => setUpgradeDialogOpen(true)}
                  >
                    {t("upgrade.open")}
                  </Button>
                }
                open={upgradeDialogOpen}
                onOpenChange={setUpgradeDialogOpen}
              />
            </div>
          </div>
        )}
        {/* 共有リンク一覧表示 */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">
            {t("lists.share.issuedLinks")}
          </h3>
          {loading ? (
            <div className="text-xs text-neutral-400">
              {t("common.loading")}
            </div>
          ) : error ? (
            <div className="text-xs text-red-500">{error}</div>
          ) : links.length > 0 ? (
            <div className="space-y-3 max-h-[40vh] sm:max-h-60 overflow-y-auto pr-1">
              {links.map((link) => {
                const fullUrl =
                  (typeof window !== "undefined"
                    ? window.location.origin
                    : process.env.NEXT_PUBLIC_BASE_URL || "") +
                  `/lists/join?token=${link.token}`;
                const handleCopy = () => {
                  if (!link.id) return;
                  navigator.clipboard.writeText(fullUrl);
                  setCopiedLinkId(link.id);
                  setTimeout(() => setCopiedLinkId(null), 1500);
                };
                const handleShare = async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: t("lists.share.linkTitle"),
                        text: t("lists.share.linkText"),
                        url: fullUrl,
                      });
                    } catch (e) {
                      console.info(
                        "Share operation was cancelled by the user or failed:",
                        e
                      );
                    }
                  } else {
                    handleCopy();
                  }
                };
                return (
                  <div
                    key={link.id}
                    className="border rounded-lg p-2 sm:p-3 flex flex-col gap-2 bg-neutral-50 shadow-sm"
                  >
                    {/* 上部：URL＋コピー/共有ボタン */}
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="text"
                        value={fullUrl}
                        readOnly
                        className="border rounded px-2 py-1 text-xs font-mono bg-neutral-100 flex-1 min-w-0 max-w-full overflow-x-auto"
                        onFocus={(e) => e.target.select()}
                        style={{ minWidth: 0 }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleCopy}
                        className="shrink-0"
                      >
                        {copiedLinkId === link.id ? (
                          <CheckCircle2 className="w-4 h-4 text-primary-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleShare}
                        className="shrink-0"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="sr-only">
                          {t("lists.actions.share")}
                        </span>
                      </Button>
                    </div>
                    {/* 下部：バッジ類＋編集・削除ボタン */}
                    <div className="flex flex-wrap gap-2 text-xs mt-1 items-end justify-between">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            link.default_permission === "edit"
                              ? "bg-primary-100 text-primary-700"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {link.default_permission === "edit"
                            ? t("lists.share.permission.editAndView")
                            : t("lists.share.permission.viewOnly")}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            link.is_active
                              ? "bg-primary-100 text-primary-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {link.is_active ? (
                            <CheckCircle2 className="inline w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="inline w-3 h-3 mr-1" />
                          )}
                          {link.is_active
                            ? t("common.active")
                            : t("common.inactive")}
                        </span>
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(link)}
                        >
                          {t("lists.actions.edit")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(link)}
                        >
                          {t("lists.actions.delete")}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-neutral-400">
              {t("lists.share.noIssuedLinks")}
            </div>
          )}
        </div>
        {/* 共有メンバー管理セクション */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-sm">
            {t("lists.share.members.title")}
          </h3>
          <div className="flex flex-col gap-2">
            {list.collaborators && list.collaborators.length > 0 ? (
              list.collaborators.map((member: Collaborator) => {
                const state = memberStates[member.id] || {
                  localPermission: member.permission,
                  loading: false,
                  showConfirm: false,
                  permissionChanged: false,
                };
                // 権限変更時にローカル状態を更新
                const handlePermissionChange = (value: string) => {
                  setMemberStates((prev) => ({
                    ...prev,
                    [member.id]: {
                      ...prev[member.id],
                      localPermission: value,
                      permissionChanged: value !== member.permission,
                    },
                  }));
                };
                // 権限保存
                const handleSavePermissionClick = async () => {
                  await handleSavePermission(member.id);
                };
                // 解除実行
                const handleRemoveClick = async () => {
                  await handleRemove(member.id);
                };
                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-y-1 p-2 border rounded-md bg-neutral-50"
                  >
                    {/* 1段目: アバター＋ユーザー名 */}
                    <div className="flex flex-row items-center gap-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={member.avatarUrl || undefined}
                          alt={member.name || t("user.unknown")}
                        />
                        <AvatarFallback>
                          {member.name
                            ? member.name.slice(0, 1).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium text-sm">
                        {member.name}
                        {member.isOwner && (
                          <span className="ml-2 text-xs text-primary-600">
                            （{t("lists.owner")}）
                          </span>
                        )}
                      </div>
                    </div>
                    {/* 2段目: セレクト＋ボタン群（オーナー以外のみ） */}
                    {!member.isOwner && (
                      <div className="flex flex-row items-center gap-x-2 mt-2 ml-10">
                        <Select
                          value={state.localPermission}
                          disabled={state.loading}
                          onValueChange={handlePermissionChange}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">
                              {t("lists.share.permission.viewOnly")}
                            </SelectItem>
                            <SelectItem value="edit">
                              {t("lists.share.permission.editAndView")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {state.permissionChanged && (
                          <Button
                            size="sm"
                            className="h-8 text-xs px-3 min-w-[90px] flex-shrink-0"
                            disabled={state.loading}
                            onClick={handleSavePermissionClick}
                          >
                            {state.loading
                              ? t("common.processing")
                              : t("common.save")}
                          </Button>
                        )}
                        <AlertDialog
                          open={state.showConfirm}
                          onOpenChange={(open) =>
                            setMemberStates((prev) => ({
                              ...prev,
                              [member.id]: {
                                ...prev[member.id],
                                showConfirm: open,
                              },
                            }))
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 text-xs px-3 min-w-[90px] flex-shrink-0"
                              disabled={state.loading}
                              onClick={() =>
                                setMemberStates((prev) => ({
                                  ...prev,
                                  [member.id]: {
                                    ...prev[member.id],
                                    showConfirm: true,
                                  },
                                }))
                              }
                            >
                              {t("lists.share.revoke")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("lists.share.removeConfirmTitle")}
                              </AlertDialogTitle>
                            </AlertDialogHeader>
                            <div className="text-sm">
                              {t("lists.share.removeConfirmBody", {
                                name: member.name,
                              })}
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={state.loading}>
                                {t("common.cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                disabled={state.loading}
                                onClick={handleRemoveClick}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t("lists.share.removeConfirmAction")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-neutral-400">
                {t("lists.share.members.empty")}
              </div>
            )}
          </div>
        </div>
        {/* 編集ダイアログ */}
        <EditShareLinkDialog
          open={!!editTarget}
          link={
            editTarget as Database["public"]["Tables"]["list_share_tokens"]["Row"]
          }
          permission={editPermission}
          setPermission={(v) => setEditPermission(v as "view" | "edit")}
          active={editActive}
          setActive={setEditActive}
          loading={editLoading}
          onClose={() => setEditTarget(null)}
          onSave={handleEditSave}
        />
        {/* 削除確認ダイアログ */}
        <DeleteShareLinkDialog
          open={!!deleteTarget}
          link={
            deleteTarget as Database["public"]["Tables"]["list_share_tokens"]["Row"]
          }
          loading={deleteLoading}
          onClose={() => setDeleteTarget(null)}
          onDelete={handleDeleteConfirm}
        />
      </DialogContent>
    </Dialog>
  );
}
