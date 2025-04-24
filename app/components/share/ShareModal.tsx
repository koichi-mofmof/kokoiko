"use client";

import React, { useState } from "react";
import { X, Copy, Users, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  placeId,
  placeName,
}) => {
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Mock groups data
  const groups = [
    { id: "1", name: "カフェ巡り友達", members: ["Alice", "Bob", "Charlie"] },
    { id: "2", name: "週末お出かけメンバー", members: ["David", "Eve"] },
    { id: "3", name: "東京観光", members: ["Frank", "Grace"] },
  ];

  const shareLink = `https://example.com/places/${placeId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("リンクをコピーしました");
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950/40 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-soft border border-neutral-200 shadow-medium max-w-md w-full overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-900">場所を共有</h3>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-neutral-600 mb-4">
            「{placeName}」を共有します
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-2">
                公開設定
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setVisibility("private")}
                  className={`w-full flex items-center px-4 py-2 rounded-soft text-sm ${
                    visibility === "private"
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  } transition-colors`}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  非公開（選択したグループのみ）
                </button>
                <button
                  onClick={() => setVisibility("public")}
                  className={`w-full flex items-center px-4 py-2 rounded-soft text-sm ${
                    visibility === "public"
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  } transition-colors`}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  公開（リンクを知っている人全員）
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-2">
                共有するグループを選択
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-soft text-sm ${
                      selectedGroups.includes(group.id)
                        ? "bg-primary-50 text-primary-700 border border-primary-200"
                        : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    } transition-colors`}
                  >
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-neutral-500">
                          {group.members.length}人のメンバー
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-2">
                共有リンク
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 rounded-soft border-neutral-300 shadow-soft text-sm bg-neutral-50"
                />
                <button
                  onClick={copyLink}
                  className="inline-flex items-center px-3 py-2 border border-neutral-300 shadow-soft text-sm rounded-soft text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                このリンクを知っている人は、アプリにログインしなくても場所の情報を見ることができます
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-soft hover:bg-neutral-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={() => {
                toast.success("共有設定を保存しました");
                onClose();
              }}
              className="px-4 py-2 text-sm text-white bg-primary-600 border border-transparent rounded-soft hover:bg-primary-700 transition-colors"
            >
              共有する
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ShareModal;
