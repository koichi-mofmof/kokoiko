"use client";

import { ViewMode } from "@/types";
import { ChartNoAxesColumn, List, Map } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewToggle({
  currentView,
  onViewChange,
}: ViewToggleProps) {
  const { t } = useI18n();
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
          className={`sm:inline whitespace-nowrap ${
            currentView === "list" ? "inline" : "hidden"
          }`}
        >
          {t("viewToggle.list")}
        </span>
      </button>
      <button
        onClick={() => onViewChange("map")}
        type="button"
        className={`${buttonBaseClass} ${
          currentView === "map" ? "w-auto px-3" : "w-9"
        } sm:w-auto sm:px-3 py-2 ${
          currentView === "map"
            ? `${activeClass} ${activeBorderClass}`
            : `${inactiveClass} ${borderClass}`
        }`}
      >
        <Map
          className={`h-4 w-4 sm:mr-2 ${
            currentView === "map" ? "mr-2" : "mr-0"
          }`}
        />
        <span
          className={`sm:inline whitespace-nowrap ${
            currentView === "map" ? "inline" : "hidden"
          }`}
        >
          {t("viewToggle.map")}
        </span>
      </button>
      <button
        onClick={() => onViewChange("ranking")}
        type="button"
        className={`${buttonBaseClass} ${
          currentView === "ranking" ? "w-auto px-3" : "w-9"
        } sm:w-auto sm:px-3 py-2 ${
          currentView === "ranking" ? activeClass : inactiveClass
        }`}
      >
        <ChartNoAxesColumn
          className={`h-4 w-4 sm:mr-2 ${
            currentView === "ranking" ? "mr-2" : "mr-0"
          }`}
        />
        <span
          className={`sm:inline whitespace-nowrap ${
            currentView === "ranking" ? "inline" : "hidden"
          }`}
        >
          {t("viewToggle.ranking")}
        </span>
      </button>
    </div>
  );
}
