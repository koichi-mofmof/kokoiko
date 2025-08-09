"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/hooks/use-i18n";
import { Plus, Tag as TagIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TagSuggestion {
  id: string;
  name: string;
  count: number;
}

interface TagInputProps {
  listId: string;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  existingTags?: TagSuggestion[];
}

export default function TagInput({
  selectedTags,
  onTagsChange,
  placeholder,
  label,
  existingTags = [],
}: TagInputProps) {
  const { t } = useI18n();
  const [tagInputValue, setTagInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    TagSuggestion[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初期表示で既存タグがある場合は候補を表示
  useEffect(() => {
    if (existingTags.length > 0) {
      setShowSuggestions(true);
    }
  }, [existingTags.length]);

  // 候補タグのフィルタリング
  useEffect(() => {
    if (existingTags.length === 0) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (tagInputValue.trim() === "") {
      // 入力値が空の場合：選択済み以外のすべての既存タグを表示
      const filtered = existingTags.filter(
        (tag) => !selectedTags.includes(tag.name)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true); // 常に表示
    } else {
      // 入力値がある場合：フィルタリングして表示
      const filtered = existingTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(tagInputValue.toLowerCase()) &&
          !selectedTags.includes(tag.name)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  }, [tagInputValue, existingTags, selectedTags]);

  const handleTagInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && tagInputValue.trim() !== "") {
      event.preventDefault();
      addTag(tagInputValue.trim());
    }
  };

  const addTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
    }
    setTagInputValue("");
    // 候補は非表示にしない（フィルタリングで自動更新される）
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleSuggestionClick = (suggestion: TagSuggestion) => {
    addTag(suggestion.name);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    // フォーカス時の処理（現在は何もしない）
  };

  const handleInputBlur = () => {
    // ブラー時も候補は表示したままにする
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="tags-input" className="block text-sm font-medium">
        {label ?? t("place.tags.labelOptional")}
      </Label>

      {/* 選択済みタグの表示 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag, index) => (
            <Badge
              key={`selected-${index}`}
              variant="secondary"
              className="inline-flex items-center px-2 py-1 text-xs bg-neutral-100 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <TagIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1.5 -mr-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">
                  {t("place.tags.removeTagAria", { name: tag })}
                </span>
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* タグ入力欄 */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            id="tags-input"
            type="text"
            value={tagInputValue}
            onChange={(e) => setTagInputValue(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={
              selectedTags.length > 0
                ? t("place.tags.addMore")
                : placeholder ?? t("place.tags.inputPlaceholder")
            }
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!tagInputValue.trim()}
            onClick={() => addTag(tagInputValue.trim())}
            className="px-3 py-2 flex-shrink-0 min-w-[64px]"
          >
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{t("common.add")}</span>
          </Button>
        </div>

        {/* 候補タグの表示（インライン） */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm max-h-48 overflow-y-auto">
            <div className="p-3">
              <div className="text-xs text-neutral-500 mb-2">
                {t("place.tags.suggestionsTitle")}
              </div>
              <div className="space-y-1">
                {filteredSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    type="button"
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Plus className="h-3 w-3 mr-2 text-neutral-400" />
                        <span className="text-sm">{suggestion.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {t("place.tags.usedCount", { n: suggestion.count })}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新規タグの場合のヒント */}
      {tagInputValue.trim() &&
        !existingTags.some(
          (tag) => tag.name.toLowerCase() === tagInputValue.toLowerCase()
        ) && (
          <div className="text-xs text-neutral-500">
            {t("place.tags.addNew", { name: tagInputValue })}
          </div>
        )}
    </div>
  );
}
