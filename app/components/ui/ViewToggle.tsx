"use client";

import { ViewMode } from "@/types";
import { ChartNoAxesColumn, List, Map } from "lucide-react";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewToggle({
  currentView,
  onViewChange,
}: ViewToggleProps) {
  const buttonBaseClass =
    "relative inline-flex items-center justify-center h-9 w-9 sm:w-auto sm:px-3 py-2 text-sm transition-colors";
  const activeClass = "bg-primary-50 text-primary-700";
  const inactiveClass = "bg-white text-neutral-700 hover:bg-neutral-50";
  const borderClass = "border-r border-neutral-200";
  const activeBorderClass = "border-r border-primary-200";

  return (
    <div className="inline-flex rounded-soft shadow-soft border border-neutral-200 overflow-hidden">
      <button
        onClick={() => onViewChange("list")}
        type="button"
        className={`${buttonBaseClass} ${
          currentView === "list" ? "w-auto px-3" : "w-9"
        } sm:w-auto sm:px-3 py-2 ${
          currentView === "list"
            ? `${activeClass} ${activeBorderClass}`
            : `${inactiveClass} ${borderClass}`
        }`}
      >
        <List
          className={`h-4 w-4 sm:mr-2 ${
            currentView === "list" ? "mr-2" : "mr-0"
          }`}
        />
        <span
          className={`sm:inline ${
            currentView === "list" ? "inline" : "hidden"
          }`}
        >
          リスト
        </span>
      </button>
      <button
        onClick={() => onViewChange("ranking")}
        type="button"
        className={`${buttonBaseClass} ${
          currentView === "ranking" ? "w-auto px-3" : "w-9"
        } sm:w-auto sm:px-3 py-2 ${
          currentView === "ranking"
            ? `${activeClass} ${activeBorderClass}`
            : `${inactiveClass} ${borderClass}`
        }`}
      >
        <ChartNoAxesColumn
          className={`h-4 w-4 sm:mr-2 ${
            currentView === "ranking" ? "mr-2" : "mr-0"
          }`}
        />
        <span
          className={`sm:inline ${
            currentView === "ranking" ? "inline" : "hidden"
          }`}
        >
          ランキング
        </span>
      </button>
      <button
        onClick={() => onViewChange("map")}
        type="button"
        className={`${buttonBaseClass} ${
          currentView === "map" ? "w-auto px-3" : "w-9"
        } sm:w-auto sm:px-3 py-2 ${
          currentView === "map" ? activeClass : inactiveClass
        }`}
      >
        <Map
          className={`h-4 w-4 sm:mr-2 ${
            currentView === "map" ? "mr-2" : "mr-0"
          }`}
        />
        <span
          className={`sm:inline ${currentView === "map" ? "inline" : "hidden"}`}
        >
          マップ
        </span>
      </button>
    </div>
  );
}
