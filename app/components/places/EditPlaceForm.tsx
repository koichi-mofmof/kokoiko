"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Tag as TagIcon, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { updatePlaceDetailsAction } from "@/lib/actions/place-actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";

interface PlaceTag {
  id: string;
  name: string;
}

interface EditPlaceFormProps {
  place: {
    id: string;
    name: string;
    address?: string;
    tags?: PlaceTag[];
    visited?: "visited" | "not_visited";
  };
  listPlaceId: string;
  onCancel?: () => void;
}

// SubmitButton (フォームの pending 状態を監視)
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中..." : "保存"}
    </Button>
  );
}

export default function EditPlaceForm({
  place,
  listPlaceId,
  onCancel,
}: EditPlaceFormProps) {
  const [selectedTags, setSelectedTags] = useState<PlaceTag[]>(
    place.tags || []
  );
  const [tagInputValue, setTagInputValue] = useState("");
  const [visitedStatus, setVisitedStatus] = useState<"visited" | "not_visited">(
    place.visited || "not_visited"
  );
  const { toast } = useToast();
  const toastShownRef = useRef(false);

  const initialState = null;
  const [updateState, updateFormAction] = useActionState(
    updatePlaceDetailsAction,
    initialState
  );

  // タグ追加
  const handleTagInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && tagInputValue.trim() !== "") {
      event.preventDefault();
      const newTag = tagInputValue.trim();
      if (!selectedTags.some((t) => t.name === newTag)) {
        setSelectedTags((prev) => [
          ...prev,
          { id: `new-${newTag}`, name: newTag },
        ]);
      }
      setTagInputValue("");
    }
  };
  // タグ削除
  const handleRemoveTag = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  useEffect(() => {
    if (toastShownRef.current) return;
    if (updateState?.success) {
      toastShownRef.current = true;
      toast({ title: "成功", description: updateState.success });
      if (onCancel) onCancel();
    } else if (updateState?.error) {
      toastShownRef.current = true;
      toast({
        title: "エラー",
        description: `更新エラー: ${updateState.error}`,
        variant: "destructive",
      });
      // console.error(updateState.fieldErrors);
    }
  }, [updateState, onCancel, toast]);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-neutral-800">{place.name}</CardTitle>
        {place.address && (
          <CardDescription className="flex items-center pt-1 text-neutral-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-neutral-600" />
            <span>{place.address.replace(/(〒?\s*\d{3}-?\d{4}\s*)/, "")}</span>
          </CardDescription>
        )}
      </CardHeader>
      <form action={updateFormAction}>
        <CardContent className="space-y-4">
          <input type="hidden" name="listPlaceId" value={listPlaceId} />
          {/* selectedTagsをJSON文字列として隠しフィールドで送信 */}
          <input
            type="hidden"
            name="tags"
            value={JSON.stringify(selectedTags)}
          />

          <div>
            <Label
              htmlFor="tags-input"
              className="block text-sm font-medium mb-1"
            >
              タグ（任意）
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
                >
                  <TagIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                  {tag.name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1.5 -mr-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {tag.name}</span>
                  </Button>
                </span>
              ))}
            </div>
            <Input
              id="tags-input"
              type="text"
              value={tagInputValue}
              onChange={(e) => setTagInputValue(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder={
                selectedTags.length > 0
                  ? "さらにタグを追加..."
                  : "タグを入力してEnter"
              }
              className="w-full"
            />
          </div>
          {/* 訪問ステータス */}
          <div className="pt-4 flex items-center space-x-2">
            <RadioGroup
              value={visitedStatus}
              onValueChange={(value: "visited" | "not_visited") =>
                setVisitedStatus(value)
              }
              className="flex space-x-4"
              name="visitedStatus"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_visited" id="not_visited" />
                <Label htmlFor="not_visited" className="font-normal">
                  未訪問
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="visited" id="visited" />
                <Label htmlFor="visited" className="font-normal">
                  訪問済み
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end items-center space-x-2">
          <div className="flex space-x-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="px-4 py-2 rounded transition"
                onClick={onCancel}
              >
                キャンセル
              </Button>
            )}
            <SubmitButton />
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
