"use client";

import React from "react";
import { Map, List, Grid } from "lucide-react";
import { ViewMode } from "@/types";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
}) => {
  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white shadow-sm">
      <button
        type="button"
        className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
          currentView === "map"
            ? "bg-primary-50 text-primary-700"
            : "text-neutral-600 hover:bg-neutral-50"
        } rounded-l-lg`}
        onClick={() => onViewChange("map")}
      >
        <Map className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">マップ</span>
      </button>

      <button
        type="button"
        className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
          currentView === "list"
            ? "bg-primary-50 text-primary-700"
            : "text-neutral-600 hover:bg-neutral-50"
        } border-l border-neutral-200`}
        onClick={() => onViewChange("list")}
      >
        <List className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">リスト</span>
      </button>

      <button
        type="button"
        className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
          currentView === "cards"
            ? "bg-primary-50 text-primary-700"
            : "text-neutral-600 hover:bg-neutral-50"
        } border-l border-neutral-200 rounded-r-lg`}
        onClick={() => onViewChange("cards")}
      >
        <Grid className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">カード</span>
      </button>
    </div>
  );
};

export default ViewToggle;
