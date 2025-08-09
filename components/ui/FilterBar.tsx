"use client";

import { HierarchicalFilter } from "@/app/components/filters/HierarchicalRegionFilter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FilterOption,
  getAvailableCountries,
  getAvailableStates,
} from "@/lib/actions/hierarchical-filter-actions";
import { FilterOptions } from "@/types";
import { ArrowLeftRight, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/hooks/use-i18n";

// 地域ラベルの多言語対応
function getStateLabel(countryCode: string): string {
  const labels: Record<string, string> = {
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
  return labels[countryCode] || "filter.states.default";
}

// 国選択ボタンコンポーネント
function CountryFilterButtons({
  listId,
  selectedCountry,
  onCountryChange,
}: {
  listId: string;
  selectedCountry?: string;
  onCountryChange: (country: string | undefined) => void;
}) {
  const { t } = useI18n();
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCountries() {
      if (!listId) return;
      setLoading(true);
      try {
        const countryOptions = await getAvailableCountries(listId);
        setCountries(countryOptions);
      } catch (error) {
        console.error("Failed to load countries:", error);
        setCountries([]);
      } finally {
        setLoading(false);
      }
    }
    loadCountries();
  }, [listId]);

  if (loading) {
    return (
      <div className="text-xs text-neutral-500">{t("common.loading")}</div>
    );
  }

  return (
    <>
      {countries.map((country) => (
        <button
          key={country.value}
          onClick={() =>
            onCountryChange(
              selectedCountry === country.value ? undefined : country.value
            )
          }
          className={`px-2.5 py-1.5 rounded-full text-xs ${
            selectedCountry === country.value
              ? "bg-primary-100 text-primary-800 border border-primary-200"
              : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
          } transition-colors`}
        >
          {country.label} ({country.count})
        </button>
      ))}
    </>
  );
}

// 州/省選択ボタンコンポーネント
function StateFilterButtons({
  listId,
  countryCode,
  selectedStates,
  onStatesChange,
}: {
  listId: string;
  countryCode: string;
  selectedStates: string[];
  onStatesChange: (states: string[]) => void;
}) {
  const { t } = useI18n();
  const [states, setStates] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStates() {
      if (!listId || !countryCode) return;
      setLoading(true);
      try {
        const stateOptions = await getAvailableStates(listId, countryCode);
        setStates(stateOptions);
      } catch (error) {
        console.error("Failed to load states:", error);
        setStates([]);
      } finally {
        setLoading(false);
      }
    }
    loadStates();
  }, [listId, countryCode]);

  const handleStateToggle = (stateValue: string) => {
    const newStates = selectedStates.includes(stateValue)
      ? selectedStates.filter((s) => s !== stateValue)
      : [...selectedStates, stateValue];
    onStatesChange(newStates);
  };

  if (loading) {
    return (
      <div className="text-xs text-neutral-500">{t("common.loading")}</div>
    );
  }

  return (
    <>
      {states.map((state) => (
        <button
          key={state.value}
          onClick={() => handleStateToggle(state.value)}
          className={`px-2.5 py-1.5 rounded-full text-xs ${
            selectedStates.includes(state.value)
              ? "bg-primary-100 text-primary-800 border border-primary-200"
              : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
          } transition-colors`}
        >
          {state.label} ({state.count})
        </button>
      ))}
    </>
  );
}

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
  availableTags: string[];
  listId: string;
}

export default function FilterBar({
  onFilterChange,
  initialFilters,
  availableTags,
  listId,
}: FilterBarProps) {
  const { t } = useI18n();
  const [filters, setFilters] = useState<FilterOptions>(() => ({
    ...initialFilters,
    tagsCondition: initialFilters.tagsCondition || "OR",
    hierarchicalRegion: initialFilters.hierarchicalRegion || {},
  }));

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];

    const newFilters = { ...filters, tags: newTags };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTagsConditionToggle = () => {
    const newCondition: "OR" | "AND" =
      filters.tagsCondition === "OR" ? "AND" : "OR";
    const newFilters = { ...filters, tagsCondition: newCondition };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleVisitedChange = (value: "visited" | "not_visited" | null) => {
    const newFilters = { ...filters, visited: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleHierarchicalRegionChange = (
    hierarchicalRegion: HierarchicalFilter
  ) => {
    const newFilters = { ...filters, hierarchicalRegion };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center justify-center h-9 w-9 sm:w-auto sm:px-3 py-2 border ${
            filters.tags.length > 0 ||
            filters.visited !== null ||
            filters.hierarchicalRegion?.country ||
            (filters.hierarchicalRegion?.states &&
              filters.hierarchicalRegion.states.length > 0)
              ? filters.tagsCondition === "AND" && filters.tags.length > 1
                ? "border-green-300 text-green-700 bg-green-50"
                : "border-primary-300 text-primary-700 bg-primary-50"
              : "border-neutral-200 text-neutral-700 bg-white"
          } rounded-soft shadow-soft text-sm hover:bg-neutral-50 transition-colors`}
        >
          <Filter className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t("filter.title")}</span>
          {(filters.tags.length > 0 ||
            filters.visited !== null ||
            filters.hierarchicalRegion?.country ||
            (filters.hierarchicalRegion?.states &&
              filters.hierarchicalRegion.states.length > 0)) && (
            <span className="ml-1.5 bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded-full text-xs hidden sm:inline">
              {filters.tags.length +
                (filters.visited !== null ? 1 : 0) +
                (filters.hierarchicalRegion?.country ? 1 : 0) +
                (filters.hierarchicalRegion?.states
                  ? filters.hierarchicalRegion.states.length
                  : 0)}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-80 max-h-[70vh] overflow-y-auto bg-white rounded-soft shadow-medium p-4 z-[1100] border border-neutral-200 animate-fadeIn"
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-neutral-800">
              {t("filter.tags")}
            </h4>
            {filters.tags.length > 1 && (
              <button
                onClick={handleTagsConditionToggle}
                className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 group ${
                  filters.tagsCondition === "AND"
                    ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200"
                } hover:shadow-sm`}
                title={
                  filters.tagsCondition === "OR"
                    ? t("filter.tooltip.or")
                    : t("filter.tooltip.and")
                }
              >
                <span className="flex items-center gap-1">
                  {filters.tagsCondition === "OR"
                    ? t("filter.any")
                    : t("filter.all")}
                  <ArrowLeftRight className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
                </span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-2.5 py-1.5 rounded-full text-xs ${
                  filters.tags.includes(tag)
                    ? filters.tagsCondition === "AND"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-primary-100 text-primary-800 border border-primary-200"
                    : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
                } transition-colors`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-neutral-800 mb-2">
            {t("filter.region")}
          </h4>
          <div className="space-y-3">
            {/* 国選択 */}
            <div>
              <h5 className="text-xs font-medium text-neutral-600 mb-1.5">
                {t("filter.country")}
              </h5>
              <div className="flex flex-wrap gap-2">
                <CountryFilterButtons
                  listId={listId}
                  selectedCountry={filters.hierarchicalRegion?.country}
                  onCountryChange={(country) =>
                    handleHierarchicalRegionChange({ country, states: [] })
                  }
                />
              </div>
            </div>

            {/* 州/省選択 */}
            {filters.hierarchicalRegion?.country && (
              <div>
                <h5 className="text-xs font-medium text-neutral-600 mb-1.5">
                  {t(getStateLabel(filters.hierarchicalRegion.country))}
                </h5>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  <StateFilterButtons
                    listId={listId}
                    countryCode={filters.hierarchicalRegion.country}
                    selectedStates={filters.hierarchicalRegion?.states || []}
                    onStatesChange={(states) =>
                      handleHierarchicalRegionChange({
                        country: filters.hierarchicalRegion?.country,
                        states,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-800 mb-2">
            {t("filter.visitedStatus")}
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => handleVisitedChange("visited")}
              className={`px-2.5 py-1.5 rounded-full text-xs ${
                filters.visited === "visited"
                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                  : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
              } transition-colors`}
            >
              {t("place.status.visited")}
            </button>
            <button
              onClick={() => handleVisitedChange("not_visited")}
              className={`px-2.5 py-1.5 rounded-full text-xs ${
                filters.visited === "not_visited"
                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                  : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
              } transition-colors`}
            >
              {t("place.status.notVisited")}
            </button>
            <button
              onClick={() => handleVisitedChange(null)}
              className={`px-2.5 py-1.5 rounded-full text-xs ${
                filters.visited === null
                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                  : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
              } transition-colors`}
            >
              {t("common.all")}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
