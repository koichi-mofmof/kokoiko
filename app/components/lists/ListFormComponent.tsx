"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import isEqual from "lodash/isEqual";
import { useEffect, useReducer, useRef } from "react";

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

// Reducer のアクションタイプ
type FormAction =
  | {
      type: "SET_FIELD";
      fieldName: keyof ListFormData;
      value: string | boolean;
    }
  | { type: "RESET_FORM"; payload: ListFormData };

// Reducer 関数
function formReducer(state: ListFormData, action: FormAction): ListFormData {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.fieldName]: action.value };
    case "RESET_FORM":
      return action.payload;
    default:
      return state;
  }
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
  const { t } = useI18n();
  const [formData, dispatch] = useReducer(formReducer, initialData);
  const prevInitialDataRef = useRef<ListFormData>(initialData);

  // initialData が変更された場合にフォームデータをリセットする
  useEffect(() => {
    if (!isEqual(prevInitialDataRef.current, initialData)) {
      dispatch({ type: "RESET_FORM", payload: initialData });
    }
    prevInitialDataRef.current = initialData;
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    dispatch({
      type: "SET_FIELD",
      fieldName: name as keyof ListFormData,
      value,
    });
  };

  const handleIsPublicChange = (checked: boolean) => {
    dispatch({ type: "SET_FIELD", fieldName: "isPublic", value: checked });
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
            {t("lists.form.name")}
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("lists.form.namePlaceholder")}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">
            {t("lists.form.descriptionOptional")}
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t("lists.form.descriptionPlaceholder")}
            rows={3}
          />
        </div>

        <div className="grid gap-3">
          <Label>{t("lists.form.visibility")}</Label>
          <RadioGroup
            value={formData.isPublic ? "public" : "private"}
            onValueChange={(value) => handleIsPublicChange(value === "public")}
            className="gap-4"
          >
            <div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="font-normal">
                  {t("lists.form.private")}
                </Label>
              </div>
              <p className="pl-6 text-sm text-muted-foreground">
                {t("lists.form.privateHelp")}
              </p>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal">
                  {t("lists.form.public")}
                </Label>
              </div>
              <p className="pl-6 text-sm text-muted-foreground">
                {t("lists.form.publicHelp")}
              </p>
            </div>
          </RadioGroup>
        </div>
      </div>

      <DialogFooter className="mt-4 flex gap-2">
        {showCancelButton && onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            {cancelButtonText || t("common.cancel")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? t("common.processing") : submitButtonText}
        </Button>
      </DialogFooter>
    </form>
  );
}
