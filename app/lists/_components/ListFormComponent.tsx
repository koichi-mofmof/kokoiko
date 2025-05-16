"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

export interface ListFormData {
  name: string;
  description: string;
  isPublic: boolean;
}

interface ListFormComponentProps {
  initialData?: ListFormData;
  onSubmit: (formData: ListFormData) => Promise<void>;
  submitButtonText: string;
  isSubmitting: boolean;
  showCancelButton?: boolean;
  onCancel?: () => void;
  cancelButtonText?: string;
}

export function ListFormComponent({
  initialData = { name: "", description: "", isPublic: false },
  onSubmit,
  submitButtonText,
  isSubmitting,
  showCancelButton = false,
  onCancel,
  cancelButtonText = "キャンセル",
}: ListFormComponentProps) {
  const [formData, setFormData] = useState<ListFormData>(initialData);

  // 初期データが変更された場合にフォームデータを更新
  useEffect(() => {
    setFormData(initialData);
  }, [initialData.name, initialData.description, initialData.isPublic]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name" className="required">
            リスト名
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="例：行きたいカフェリスト"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">説明（オプション）</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="例：東京都内のおすすめカフェリスト"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPublic"
            checked={formData.isPublic}
            onCheckedChange={handleSwitchChange}
          />
          <Label htmlFor="isPublic">公開リストにする</Label>
        </div>
      </div>

      <DialogFooter>
        {showCancelButton && onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            {cancelButtonText}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "処理中..." : submitButtonText}
        </Button>
      </DialogFooter>
    </form>
  );
}
