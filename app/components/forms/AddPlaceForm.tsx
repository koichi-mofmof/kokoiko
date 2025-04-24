"use client";

import React, { useState } from "react";
import {
  MapPin,
  Tag,
  Calendar,
  X,
  PlusCircle,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SpotSearch from "../search/SpotSearch";
import { availableTags } from "@/lib/data/mockData";

interface AddPlaceFormProps {
  onSubmit: (placeData: {
    googleMapsUrl: string;
    name: string;
    address: string;
    notes: string;
    tags: string[];
    visitPlanned?: Date;
    images?: string[];
    links?: string[];
    category?: string;
  }) => void;
}

const AddPlaceForm: React.FC<AddPlaceFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visitPlanned, setVisitPlanned] = useState<string>("");
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("");
  const [placeId, setPlaceId] = useState<string>("");

  const handleSpotSelect = (spot: {
    name: string;
    address: string;
    placeId: string;
    latitude: number;
    longitude: number;
  }) => {
    setName(spot.name);
    setAddress(spot.address);
    setPlaceId(spot.placeId);
  };

  const handleTagToggle = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      googleMapsUrl: `https://maps.google.com/?q=place_id:${placeId}`,
      name,
      address,
      notes,
      tags,
      visitPlanned: visitPlanned ? new Date(visitPlanned) : undefined,
      images,
      links,
      category,
    });

    // Reset form
    setName("");
    setAddress("");
    setNotes("");
    setTags([]);
    setVisitPlanned("");
    setImages([]);
    setLinks([]);
    setCategory("");
    setPlaceId("");
  };

  const categories = [
    { id: "date", name: "デート", color: "bg-pink-100 text-pink-800" },
    { id: "cafe", name: "カフェ巡り", color: "bg-amber-100 text-amber-800" },
    { id: "dinner", name: "食事", color: "bg-emerald-100 text-emerald-800" },
    {
      id: "shopping",
      name: "ショッピング",
      color: "bg-blue-100 text-blue-800",
    },
    { id: "culture", name: "文化施設", color: "bg-purple-100 text-purple-800" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-sm p-5 border border-neutral-100"
    >
      <h2 className="text-lg font-medium text-neutral-800 mb-4">場所を追加</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            場所を検索
          </label>
          <SpotSearch onSpotSelect={handleSpotSelect} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              場所の名前
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              住所
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            カテゴリ
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat.id
                    ? cat.color
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            メモ（行きたい理由など）
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="このお店について、行きたい理由など..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              画像を追加
            </label>
            <button
              type="button"
              onClick={() =>
                setImages([...images, "https://example.com/image.jpg"])
              }
              className="w-full flex items-center justify-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              画像をアップロード
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              関連リンク
            </label>
            <button
              type="button"
              onClick={() => setLinks([...links, ""])}
              className="w-full flex items-center justify-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              リンクを追加
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            タグ
          </label>
          <div className="relative">
            <div
              className="min-h-10 p-2 border border-neutral-300 rounded-md shadow-sm focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 flex flex-wrap gap-1 cursor-text"
              onClick={() => setShowTagSelector(true)}
            >
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTags(tags.filter((t) => t !== tag));
                      }}
                      className="ml-1 text-primary-500 hover:text-primary-700 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-sm text-neutral-500">
                  クリックしてタグを追加
                </span>
              )}
            </div>

            <AnimatePresence>
              {showTagSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute mt-1 w-full bg-white border border-neutral-300 rounded-md shadow-lg z-10"
                >
                  <div className="p-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tags.includes(tag)
                              ? "bg-primary-100 text-primary-800"
                              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        className="text-xs text-neutral-500 hover:text-neutral-700"
                        onClick={() => setTags([])}
                      >
                        すべてクリア
                      </button>
                      <button
                        type="button"
                        className="text-xs text-primary-600 hover:text-primary-800"
                        onClick={() => setShowTagSelector(false)}
                      >
                        完了
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div>
          <label
            htmlFor="visitPlanned"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            訪問予定日 (任意)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="date"
              id="visitPlanned"
              value={visitPlanned}
              onChange={(e) => setVisitPlanned(e.target.value)}
              className="block w-full pl-10 rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            保存する
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddPlaceForm;
