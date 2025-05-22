"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
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

  const handlePlaceRegistered = () => {
    setOpen(false);
    setFormKey(Date.now());
    // TODO: router.refresh() や、より洗練された状態更新をここで行う
    // 例: import { useRouter } from 'next/navigation'; const router = useRouter(); router.refresh();
    // sonnerToast.success("場所がリストに追加されました！"); // AddPlaceForm内で出すので不要かも
  };

  const handleRequestFormReset = () => {
    setFormKey(Date.now());
  };

  return (
    <>
      {/* スマートフォン表示用のフローティングボタン */}
      <Button
        variant="outline"
        className="h-10 w-10 rounded-full shadow-lg md:hidden"
        aria-label="場所を追加 (スマートフォン)"
        onClick={() => setOpen(true)}
      >
        <Plus />
      </Button>
      {/* PC表示用のボタン */}
      <Button
        className="hidden md:inline-flex items-center shadow-md"
        aria-label="場所を追加 (PC)"
        onClick={() => setOpen(true)}
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
            <DialogTitle className="text-xl">
              新しい場所をリストに追加
            </DialogTitle>
          </DialogHeader>
          <AddPlaceForm
            key={formKey}
            listId={listId}
            onPlaceRegistered={handlePlaceRegistered}
            onResetRequest={handleRequestFormReset}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
