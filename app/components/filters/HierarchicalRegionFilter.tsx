"use client";

import { useI18n } from "@/hooks/use-i18n";
import {
  FilterOption,
  getAvailableCountries,
  getAvailableStates,
} from "@/lib/actions/hierarchical-filter-actions";
import { Globe, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

// 階層フィルターの型定義
export interface HierarchicalFilter {
  country?: string;
  states?: string[]; // 複数選択対応
}

interface HierarchicalRegionFilterProps {
  listId: string;
  onFilterChange: (filter: HierarchicalFilter) => void;
  initialFilter?: HierarchicalFilter;
  className?: string;
}

// 地域ラベルの多言語対応（tを使用）
type TranslateFn = (
  key: string,
  params?: Record<string, string | number>
) => string;
function getStateLabel(t: TranslateFn, countryCode: string): string {
  const keyMap: Record<string, string> = {
    JP: "filter.states.JP",
    US: "filter.states.US",
    CA: "filter.states.CA",
    AU: "filter.states.AU",
    CN: "filter.states.CN",
    DE: "filter.states.DE",
    FR: "filter.states.FR",
    IT: "filter.states.IT",
    ES: "filter.states.ES",
    GB: "filter.states.GB",
    IN: "filter.states.IN",
    BR: "filter.states.BR",
    MX: "filter.states.MX",
    RU: "filter.states.RU",
    KR: "filter.states.KR",
  };
  const key = keyMap[countryCode] || "filter.states.default";
  return t(key);
}

// フィルター説明文の生成
function buildFilterDescription(
  filter: HierarchicalFilter,
  countries: FilterOption[],
  states: FilterOption[]
): string {
  const parts: string[] = [];

  if (filter.country) {
    const country = countries.find((c) => c.value === filter.country);
    if (country) parts.push(country.label);
  }

  if (filter.states && filter.states.length > 0) {
    const stateLabels = filter.states
      .map((stateValue) => states.find((s) => s.value === stateValue)?.label)
      .filter(Boolean);
    if (stateLabels.length > 0) parts.push(stateLabels.join(", "));
  }

  return parts.join(" > ");
}

export default function HierarchicalRegionFilter({
  listId,
  onFilterChange,
  initialFilter = {},
  className = "",
}: HierarchicalRegionFilterProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<HierarchicalFilter>(initialFilter);
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [states, setStates] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // 国一覧の取得
  useEffect(() => {
    async function loadCountries() {
      if (!listId) return;

      setLoading(true);
      setErrorKey(null);

      try {
        const countryOptions = await getAvailableCountries(listId);
        setCountries(countryOptions);
      } catch (error) {
        console.error("Failed to load countries:", error);
        setErrorKey("filter.errors.countriesFailed");
        setCountries([]);
      } finally {
        setLoading(false);
      }
    }

    loadCountries();
  }, [listId]);

  // 州/省一覧の取得（国選択時）
  useEffect(() => {
    async function loadStates() {
      if (!filter.country) {
        setStates([]);
        return;
      }

      setLoading(true);
      setErrorKey(null);

      try {
        const stateOptions = await getAvailableStates(listId, filter.country);
        setStates(stateOptions);
      } catch (error) {
        console.error("Failed to load states:", error);
        setErrorKey("filter.errors.statesFailed");
        setStates([]);
      } finally {
        setLoading(false);
      }
    }

    loadStates();
  }, [listId, filter.country]);

  // 国選択の処理
  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = event.target.value || undefined;
    const newFilter: HierarchicalFilter = {
      country: countryCode,
      states: [], // 国が変わったら州/省はリセット
    };
    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  // 州/省選択の処理（複数選択対応）
  const handleStateToggle = (stateValue: string) => {
    const currentStates = filter.states || [];
    const newStates = currentStates.includes(stateValue)
      ? currentStates.filter((s) => s !== stateValue)
      : [...currentStates, stateValue];

    const newFilter: HierarchicalFilter = {
      ...filter,
      states: newStates,
    };
    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  // フィルタークリア
  const handleClearFilter = () => {
    const newFilter: HierarchicalFilter = {};
    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  // エラー表示
  if (errorKey) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        <p>{t(errorKey)}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 国選択 */}
      <div>
        <label className="flex items-center text-sm font-medium text-neutral-700 mb-2">
          <Globe className="h-4 w-4 mr-1.5" />
          {t("filter.country")}
        </label>
        <select
          value={filter.country || ""}
          onChange={handleCountryChange}
          disabled={loading || countries.length === 0}
          className="w-full px-3 py-2 border border-neutral-200 rounded-soft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-400"
        >
          <option value="">{t("filter.allCountries")}</option>
          {countries.map((country) => (
            <option key={country.value} value={country.value}>
              {country.label} ({country.count})
            </option>
          ))}
        </select>
      </div>

      {/* 州/省選択（複数選択対応） */}
      {filter.country && states.length > 0 && (
        <div>
          <label className="flex items-center text-sm font-medium text-neutral-700 mb-2">
            <MapPin className="h-4 w-4 mr-1.5" />
            {getStateLabel(t, filter.country)}
            {t("filter.multiNote")}
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-neutral-200 rounded-soft p-3 bg-white">
            {states.map((state) => (
              <label
                key={state.value}
                className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-50 p-1.5 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filter.states?.includes(state.value) || false}
                  onChange={() => handleStateToggle(state.value)}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
                  disabled={loading}
                />
                <span className="text-sm text-neutral-700 flex-1">
                  {state.label} ({state.count})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* フィルター状態表示 */}
      {(filter.country || (filter.states && filter.states.length > 0)) && (
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-800 font-medium">
                {t("filter.current")}
              </p>
              <p className="text-sm text-primary-700">
                {buildFilterDescription(filter, countries, states)}
              </p>
            </div>
            <button
              onClick={handleClearFilter}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
              data-testid="clear-filter-button"
            >
              {t("common.clear")}
            </button>
          </div>
        </div>
      )}

      {/* ローディング状態 */}
      {loading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-sm text-neutral-600">
            {t("common.loading")}
          </span>
        </div>
      )}

      {/* データなしメッセージ */}
      {!loading && countries.length === 0 && (
        <div className="text-sm text-neutral-500 text-center py-2">
          {t("filter.noRegions")}
        </div>
      )}
    </div>
  );
}
