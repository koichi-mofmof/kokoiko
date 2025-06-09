"use client";

import { UpgradePlanDialog } from "@/app/components/billing/UpgradePlanDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/use-subscription";
import { SUBSCRIPTION_LIMITS } from "@/lib/constants/config/subscription";
import { Info, Plus } from "lucide-react";
import { useState } from "react";
import AddPlaceForm from "./AddPlaceForm";

interface AddPlaceButtonClientProps {
  listId: string;
}

export default function AddPlaceButtonClient({
  listId,
}: AddPlaceButtonClientProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const {
    plan,
    registeredPlacesThisMonth,
    maxPlaces,
    loading,
    refreshSubscription,
  } = useSubscription();

  const handlePlaceRegistered = () => {
    setOpen(false);
    setFormKey(Date.now());
    refreshSubscription();
  };

  const handleRequestFormReset = () => {
    setFormKey(Date.now());
  };

  const handleAddPlaceClick = () => {
    if (
      !loading &&
      plan === "free" &&
      maxPlaces !== null &&
      registeredPlacesThisMonth >= maxPlaces
    ) {
      setShowLimitAlert(true);
      return;
    }
    setOpen(true);
  };

  const handleUpgradeClick = () => {
    setShowLimitAlert(false);
    setShowUpgradeDialog(true);
  };

  return (
    <>
      {/* スマートフォン表示用のフローティングボタン */}
      <Button
        className="h-10 w-10 rounded-full shadow-lg md:hidden"
        aria-label="場所を追加 (スマートフォン)"
        onClick={handleAddPlaceClick}
        data-testid="AddPlaceButtonClient"
      >
        <Plus />
      </Button>
      {/* PC表示用のボタン */}
      <Button
        className="hidden md:inline-flex items-center shadow-md"
        aria-label="場所を追加 (PC)"
        onClick={handleAddPlaceClick}
        data-testid="AddPlaceButtonClient"
      >
        <Plus className="h-5 w-5 mr-2" />
        場所を追加
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-[425px] md:max-w-[600px] max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader className="mb-4">
            <DialogTitle>新しい場所をリストに追加</DialogTitle>
          </DialogHeader>
          <AddPlaceForm
            key={formKey}
            listId={listId}
            onPlaceRegistered={handlePlaceRegistered}
            onResetRequest={handleRequestFormReset}
          />
        </DialogContent>
      </Dialog>
      {/* 上限到達時の案内AlertDialog */}
      <AlertDialog open={showLimitAlert} onOpenChange={setShowLimitAlert}>
        <AlertDialogContent className="max-w-md border-yellow-300 bg-yellow-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-yellow-900">
              <Info className="w-6 h-6 text-primary-500 mr-2" />
              登録地点数の上限に達しました！
            </AlertDialogTitle>
            <AlertDialogDescription className="text-yellow-900">
              フリープランでは登録できる地点は{" "}
              <span className="font-bold">
                {SUBSCRIPTION_LIMITS.free.MAX_PLACES_PER_MONTH}件/月
              </span>{" "}
              までです。
              <br />
              <span className="block mt-2">
                プレミアムプランにアップグレードすると、
                <span className="font-bold">無制限</span>に地点を登録できます。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-primary-700 hover:bg-primary-800"
              onClick={handleUpgradeClick}
            >
              今すぐアップグレード
            </AlertDialogAction>
            <AlertDialogCancel>閉じる</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* アップグレードダイアログ */}
      {showUpgradeDialog && (
        <UpgradePlanDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
        />
      )}
    </>
  );
}
