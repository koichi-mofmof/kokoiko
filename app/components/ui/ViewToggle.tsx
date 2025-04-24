"use client";

import { Grid, List, Map } from "lucide-react";
import { ViewMode } from "@/types";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewToggle({
  currentView,
  onViewChange,
}: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-soft shadow-soft border border-neutral-200 overflow-hidden">
      <button
        onClick={() => onViewChange("cards")}
        className={`relative inline-flex items-center px-3 py-2 text-sm ${
          currentView === "cards"
            ? "bg-primary-50 text-primary-700 border-r border-primary-200"
            : "bg-white text-neutral-700 border-r border-neutral-200 hover:bg-neutral-50"
        } transition-colors`}
      >
        <Grid className="h-4 w-4" />
        <span className="sr-only">カード表示</span>
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`relative inline-flex items-center px-3 py-2 text-sm ${
          currentView === "list"
            ? "bg-primary-50 text-primary-700 border-r border-primary-200"
            : "bg-white text-neutral-700 border-r border-neutral-200 hover:bg-neutral-50"
        } transition-colors`}
      >
        <List className="h-4 w-4" />
        <span className="sr-only">リスト表示</span>
      </button>
      <button
        onClick={() => onViewChange("map")}
        className={`relative inline-flex items-center px-3 py-2 text-sm ${
          currentView === "map"
            ? "bg-primary-50 text-primary-700"
            : "bg-white text-neutral-700 hover:bg-neutral-50"
        } transition-colors`}
      >
        <Map className="h-4 w-4" />
        <span className="sr-only">マップ表示</span>
      </button>
    </div>
  );
}
