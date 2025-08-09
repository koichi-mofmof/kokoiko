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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { updatePlaceDetailsAction } from "@/lib/actions/place-actions";
import { getListTags } from "@/lib/dal/lists";
import { MapPin } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import TagInput from "./TagInput";

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
  listId: string;
  onCancel?: () => void;
}

// SubmitButton (フォームの pending 状態を監視)
function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export default function EditPlaceForm({
  place,
  listPlaceId,
  listId,
  onCancel,
}: EditPlaceFormProps) {
  const { t } = useI18n();
  const [selectedTags, setSelectedTags] = useState<string[]>(
    place.tags?.map((tag) => tag.name) || []
  );
  const [existingTags, setExistingTags] = useState<
    { id: string; name: string; count: number }[]
  >([]);
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

  // 既存タグを取得
  useEffect(() => {
    async function fetchExistingTags() {
      try {
        const tags = await getListTags(listId);
        setExistingTags(tags);
      } catch (error) {
        console.error("Error fetching existing tags:", error);
      }
    }

    fetchExistingTags();
  }, [listId]);

  useEffect(() => {
    if (toastShownRef.current) return;
    if (updateState?.success) {
      toastShownRef.current = true;
      toast({ title: t("common.success"), description: updateState.success });
      if (onCancel) onCancel();
    } else if (updateState?.error) {
      toastShownRef.current = true;
      toast({
        title: t("common.error"),
        description: `${t("common.updateError")}: ${updateState.error}`,
        variant: "destructive",
      });
      // console.error(updateState.fieldErrors);
    }
  }, [updateState, onCancel, toast, t]);

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
            value={JSON.stringify(
              selectedTags.map((tag) => ({ id: `new-${tag}`, name: tag }))
            )}
          />

          <div>
            <TagInput
              listId={listId}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              existingTags={existingTags}
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
                  {t("place.status.notVisited")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="visited" id="visited" />
                <Label htmlFor="visited" className="font-normal">
                  {t("place.status.visited")}
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
                {t("common.cancel")}
              </Button>
            )}
            <SubmitButton />
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
