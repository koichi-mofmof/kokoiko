"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UpgradePlanDialog } from "@/app/components/billing/UpgradePlanDialog";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { trackTemplateCopyEvents } from "@/lib/analytics/events";
import {
  copyPlacesToList,
  getOwnedListsForCopy,
} from "@/lib/actions/template-copy.actions";
import {
  savePendingCopyIntent,
  type PendingCopyIntent,
} from "@/lib/utils/pending-copy";
import type { Place } from "@/types";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TemplateCopyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceListId: string;
  sourceListName?: string;
  places: Place[];
  isLoggedIn: boolean;
  /** 登録後の復元時に渡す。値入り・target ステップで開き、ワンタップでコピーさせる。 */
  resumeIntent?: PendingCopyIntent | null;
}

type Step = "select" | "target";
type TargetType = "new" | "existing";

export function TemplateCopyModal({
  open,
  onOpenChange,
  sourceListId,
  sourceListName,
  places,
  isLoggedIn,
  resumeIntent = null,
}: TemplateCopyModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<Step>(resumeIntent ? "target" : "select");
  const [selected, setSelected] = useState<Set<string>>(() =>
    resumeIntent
      ? new Set(resumeIntent.placeIds)
      : new Set(places.map((p) => p.id))
  );
  const [targetType, setTargetType] = useState<TargetType>("new");
  const [newName, setNewName] = useState(
    resumeIntent?.target.name ?? sourceListName ?? ""
  );
  const [newDescription, setNewDescription] = useState(
    resumeIntent?.target.description ?? ""
  );
  const [isPublic, setIsPublic] = useState(resumeIntent?.target.isPublic ?? false);
  const [existingListId, setExistingListId] = useState<string>("");
  const [ownedLists, setOwnedLists] = useState<{ id: string; name: string }[]>(
    []
  );
  const [ownedListsLoaded, setOwnedListsLoaded] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  // 上限超過でコピーをブロックした際の案内（選び直し/アップグレード導線）
  const [limitInfo, setLimitInfo] = useState<{
    remaining: number;
    requested: number;
    full: boolean;
  } | null>(null);
  // アップグレードモーダル（ヘッダーの「アップグレード」と同じダイアログ）
  const [showUpgrade, setShowUpgrade] = useState(false);

  const allSelected = selected.size === places.length && places.length > 0;

  const resetAndClose = () => {
    onOpenChange(false);
    // 次に開いたときのために少し遅延してリセット
    setTimeout(() => {
      setStep("select");
      setSelected(new Set(places.map((p) => p.id)));
      setTargetType("new");
      setNewName(sourceListName ?? "");
      setNewDescription("");
      setIsPublic(false);
      setExistingListId("");
      setLimitInfo(null);
    }, 200);
  };

  const toggle = (placeId: string) => {
    setLimitInfo(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const toggleAll = () => {
    setLimitInfo(null);
    setSelected(allSelected ? new Set() : new Set(places.map((p) => p.id)));
  };

  const goToTarget = async () => {
    if (selected.size === 0) {
      toast({
        title: t("common.error"),
        description: t("templateCopy.errors.noSelection"),
        variant: "destructive",
      });
      return;
    }
    // 既存リスト候補を初回のみ取得（ゲストは所有リストが無いのでスキップ）
    if (isLoggedIn && !ownedListsLoaded) {
      const lists = await getOwnedListsForCopy();
      setOwnedLists(lists);
      setOwnedListsLoaded(true);
    }
    setStep("target");
  };

  const handleCopy = async () => {
    // 体験先行ゲート: ゲストはここまでの入力を保存し、登録導線へ送る。
    // 登録後は同じリストページの ResumeCopy が復元してワンタップでコピーを完遂する。
    if (!isLoggedIn) {
      savePendingCopyIntent({
        sourceListId,
        placeIds: Array.from(selected),
        target: {
          type: "new",
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          isPublic,
        },
      });
      trackTemplateCopyEvents.gatedSignup(sourceListId);
      router.push(`/signup?returnTo=/lists/${sourceListId}&pendingCopy=1`);
      return;
    }

    setIsCopying(true);
    trackTemplateCopyEvents.copyStart(sourceListId);

    try {
      const placeIds = Array.from(selected);
      const target =
        targetType === "new"
          ? {
              type: "new" as const,
              name: newName.trim(),
              description: newDescription.trim() || undefined,
              isPublic,
            }
          : { type: "existing" as const, listId: existingListId };

      const result = await copyPlacesToList({ sourceListId, placeIds, target });

      // 上限超過: コピーせず、モーダルを開いたまま選び直し/アップグレードを促す
      if (result.limitReached) {
        const remaining = result.remainingPlaces ?? 0;
        setLimitInfo({
          remaining,
          requested: result.requestedCount ?? selected.size,
          full: remaining <= 0,
        });
        setStep("select");
        return;
      }

      if (!result.success) {
        toast({
          title: t("common.error"),
          description: result.errorKey
            ? t(result.errorKey)
            : result.error || t("templateCopy.errors.copyFailed"),
          variant: "destructive",
        });
        return;
      }

      trackTemplateCopyEvents.copyComplete(
        sourceListId,
        result.copiedCount ?? 0
      );

      // 結果メッセージ組み立て
      const parts: string[] = [];
      if ((result.copiedCount ?? 0) > 0) {
        parts.push(
          t("templateCopy.result.success", { count: result.copiedCount ?? 0 })
        );
      } else {
        parts.push(t("templateCopy.result.nothingCopied"));
      }
      if ((result.skippedDuplicates ?? 0) > 0) {
        parts.push(
          t("templateCopy.result.duplicatesSkipped", {
            count: result.skippedDuplicates ?? 0,
          })
        );
      }

      toast({
        title: t("templateCopy.modal.title"),
        description: parts.join(" "),
      });

      resetAndClose();

      if (result.targetListId && (result.copiedCount ?? 0) > 0) {
        router.push(`/lists/${result.targetListId}`);
        router.refresh();
      }
    } finally {
      setIsCopying(false);
    }
  };

  const canCopy =
    targetType === "new"
      ? newName.trim().length > 0
      : existingListId.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => (o ? null : resetAndClose())}>
        <DialogContent
          className="sm:max-w-[480px] max-h-[85vh] flex flex-col"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
        <DialogHeader>
          <DialogTitle>{t("templateCopy.modal.title")}</DialogTitle>
          <DialogDescription>
            {step === "select"
              ? t("templateCopy.modal.selectPlaces")
              : t("templateCopy.target.title")}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <>
            {limitInfo && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div>
                    {limitInfo.full
                      ? t("templateCopy.limit.full")
                      : t("templateCopy.limit.exceeded", {
                          remaining: limitInfo.remaining,
                          requested: limitInfo.requested,
                        })}
                    <button
                      type="button"
                      onClick={() => setShowUpgrade(true)}
                      className="mt-1 block font-medium underline"
                    >
                      {t("templateCopy.limit.upgrade")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between py-1">
              <button
                type="button"
                onClick={toggleAll}
                className="text-sm text-primary-600 hover:underline"
              >
                {allSelected
                  ? t("templateCopy.modal.deselectAll")
                  : t("templateCopy.modal.selectAll")}
              </button>
              <span className="text-sm text-neutral-500">
                {t("templateCopy.modal.selectedCount", { count: selected.size })}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
              {places.map((place) => (
                <label
                  key={place.id}
                  className="flex items-start gap-3 rounded-md border border-neutral-200 p-3 cursor-pointer hover:bg-neutral-50"
                >
                  <Checkbox
                    checked={selected.has(place.id)}
                    onCheckedChange={() => toggle(place.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-neutral-900 truncate">
                      {place.name}
                    </div>
                    {place.address && (
                      <div className="text-xs text-neutral-500 truncate">
                        {place.address}
                      </div>
                    )}
                    {place.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {place.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] text-primary-700"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>
                {t("common.cancel")}
              </Button>
              <Button onClick={goToTarget} disabled={selected.size === 0}>
                {t("templateCopy.modal.next")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "target" && (
          <>
            <div className="flex-1 overflow-y-auto space-y-4">
              {resumeIntent && (
                <div className="flex items-start gap-2 rounded-md border border-primary-200 bg-primary-50 p-3 text-sm text-primary-800">
                  <RotateCcw className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {t("templateCopy.resume.restored")}
                    </div>
                    <div className="text-xs text-primary-700">
                      {t("templateCopy.resume.hint")}
                    </div>
                  </div>
                </div>
              )}
              {!isLoggedIn && (
                <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
                  {t("templateCopy.guest.gateNote")}
                </div>
              )}
              <RadioGroup
                value={targetType}
                onValueChange={(v) => setTargetType(v as TargetType)}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="new" id="tc-target-new" />
                  <Label htmlFor="tc-target-new">
                    {t("templateCopy.target.newList")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="existing"
                    id="tc-target-existing"
                    disabled={ownedLists.length === 0}
                  />
                  <Label htmlFor="tc-target-existing">
                    {t("templateCopy.target.existingList")}
                  </Label>
                </div>
              </RadioGroup>

              {targetType === "new" ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="tc-name">
                      {t("templateCopy.target.listName")}
                    </Label>
                    <Input
                      id="tc-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t("templateCopy.target.listNamePlaceholder")}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tc-desc">
                      {t("templateCopy.target.description")}
                    </Label>
                    <Textarea
                      id="tc-desc"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      maxLength={500}
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="tc-public"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="tc-public">
                      {t("templateCopy.target.makePublic")}
                    </Label>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>{t("templateCopy.target.selectExisting")}</Label>
                  {ownedLists.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      {t("templateCopy.target.noLists")}
                    </p>
                  ) : (
                    <Select
                      value={existingListId}
                      onValueChange={setExistingListId}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("templateCopy.target.selectExisting")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {ownedLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("select")}
                disabled={isCopying}
              >
                {t("templateCopy.modal.back")}
              </Button>
              <Button onClick={handleCopy} disabled={!canCopy || isCopying}>
                {isCopying && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isCopying
                  ? t("templateCopy.progress.copying")
                  : isLoggedIn
                    ? t("templateCopy.action.copy")
                    : t("templateCopy.guest.saveButton")}
              </Button>
            </DialogFooter>
          </>
        )}
        </DialogContent>
      </Dialog>

      {/* アップグレードモーダル（ヘッダーの「アップグレード」と同一ダイアログを制御表示） */}
      <UpgradePlanDialog open={showUpgrade} onOpenChange={setShowUpgrade} />
    </>
  );
}
