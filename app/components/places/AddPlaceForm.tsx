"use client";

import { useState } from "react";
import { Map, MapPin, Tag, Calendar } from "lucide-react";

interface AddPlaceFormProps {
  onSubmit: (data: {
    googleMapsUrl: string;
    name: string;
    address: string;
    notes: string;
    tags: string[];
    visitPlanned?: Date;
  }) => void;
}

export default function AddPlaceForm({ onSubmit }: AddPlaceFormProps) {
  const [formData, setFormData] = useState({
    googleMapsUrl: "",
    name: "",
    address: "",
    notes: "",
    plannedVisit: "",
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 利用可能なタグのリスト（実際のアプリではデータから動的に生成される）
  const availableTags = [
    "レストラン",
    "カフェ",
    "公園",
    "ショップ",
    "美術館",
    "観光地",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // フォームデータを整形
      const submitData = {
        googleMapsUrl: formData.googleMapsUrl,
        name: formData.name,
        address: formData.address,
        notes: formData.notes,
        tags: selectedTags,
        ...(formData.plannedVisit
          ? { visitPlanned: new Date(formData.plannedVisit) }
          : {}),
      };

      // 送信
      onSubmit(submitData);

      // フォームをリセット
      setFormData({
        googleMapsUrl: "",
        name: "",
        address: "",
        notes: "",
        plannedVisit: "",
      });
      setSelectedTags([]);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-soft border border-neutral-200 shadow-soft p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-neutral-900 flex items-center">
          <MapPin className="h-6 w-6 text-primary-600 mr-2" />
          新しい場所を追加
        </h1>
        <p className="text-neutral-600 mt-1">
          行きたい場所や気になるスポットを追加しましょう。
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label
            htmlFor="googleMapsUrl"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Google Maps URL
          </label>
          <div className="relative rounded-soft shadow-soft">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Map className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="url"
              id="googleMapsUrl"
              name="googleMapsUrl"
              value={formData.googleMapsUrl}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-soft focus:ring-primary-500/50 focus:border-primary-500 text-sm"
              placeholder="https://maps.google.com/..."
              required
            />
          </div>
        </div>

        <div className="mb-5">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            場所の名前
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-soft focus:ring-primary-500/50 focus:border-primary-500 text-sm"
            placeholder="レストラン名、公園名など"
            required
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            住所
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-soft focus:ring-primary-500/50 focus:border-primary-500 text-sm"
            placeholder="東京都新宿区..."
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center">
            <Tag className="h-4 w-4 mr-1" />
            タグ
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  selectedTags.includes(tag)
                    ? "bg-primary-100 text-primary-800 border border-primary-300"
                    : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
                } transition-colors`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label
            htmlFor="plannedVisit"
            className="block text-sm font-medium text-neutral-700 mb-1 flex items-center"
          >
            <Calendar className="h-4 w-4 mr-1" />
            訪問予定日（任意）
          </label>
          <input
            type="date"
            id="plannedVisit"
            name="plannedVisit"
            value={formData.plannedVisit}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-soft focus:ring-primary-500/50 focus:border-primary-500 text-sm"
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            メモ（任意）
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-soft focus:ring-primary-500/50 focus:border-primary-500 text-sm"
            placeholder="メニューの情報や、訪問の理由など"
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-soft shadow-soft text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "送信中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
