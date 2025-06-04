import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import React from "react";
import type { Database } from "@/types/supabase";

interface EditShareLinkDialogProps {
  open: boolean;
  link: Database["public"]["Tables"]["list_share_tokens"]["Row"] | null;
  permission: string;
  setPermission: (v: string) => void;
  active: boolean;
  setActive: (v: boolean) => void;
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditShareLinkDialog({
  open,
  link,
  permission,
  setPermission,
  active,
  setActive,
  loading,
  onClose,
  onSave,
}: EditShareLinkDialogProps) {
  if (!link) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs p-6">
        <DialogTitle>共有リンク編集</DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-row items-center gap-x-4">
            <label className="block text-sm font-medium">権限 ：</label>
            <RadioGroup
              value={permission}
              onValueChange={setPermission}
              name="edit-permission"
              className="flex flex-row gap-4"
            >
              <div className="flex items-center gap-1">
                <RadioGroupItem value="view" id={`edit-perm-view-${link.id}`} />
                <label
                  htmlFor={`edit-perm-view-${link.id}`}
                  className="text-sm"
                >
                  閲覧のみ
                </label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="edit" id={`edit-perm-edit-${link.id}`} />
                <label
                  htmlFor={`edit-perm-edit-${link.id}`}
                  className="text-sm"
                >
                  編集＋閲覧
                </label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor={`edit-active-${link.id}`} className="text-sm">
              有効化 ：
            </label>
            <Switch
              id={`edit-active-${link.id}`}
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              保存
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
