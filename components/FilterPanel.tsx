"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  Film,
  Ticket,
  Store,
  Coffee,
  Package,
  UtensilsCrossed,
  MapPin,
  Check,
  Search,
} from "lucide-react";
import { REGIONS } from "@/lib/regionConfig";
import { CITIES } from "@/lib/cityConfig";

interface FilterPanelProps {
  currentRegionSlug?: string;
  currentCitySlug?: string;
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
  selectedCenter?: string | null;
  onCenterChange?: (center: string | null) => void;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const GIFT_TAGS = [
  { id: "電影票", label: "電影票", icon: Film },
  { id: "禮券", label: "禮券", icon: Ticket },
  { id: "超商", label: "超商", icon: Store },
  { id: "餐飲", label: "餐飲", icon: Coffee },
  { id: "生活用品", label: "生活用品", icon: Package },
  { id: "食品", label: "食品", icon: UtensilsCrossed },
];

export default function FilterPanel({
  currentRegionSlug,
  currentCitySlug,
  selectedTags,
  onTagChange,
  selectedCenter,
  onCenterChange,
  onSearchChange,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 若在城市頁，推算所屬地區 slug 用於 highlight
  const activeRegionSlug =
    currentRegionSlug ??
    (currentCitySlug
      ? CITIES.find((c) => c.slug === currentCitySlug)?.regionSlug
      : undefined);

  // 地區頁或城市頁上地區按鈕必須跳頁，否則 selectedCenter 和 server-side 過濾會衝突造成無結果
  const regionUseLinks = !!currentCitySlug || !!currentRegionSlug;

  const activeFiltersCount = (currentRegionSlug || selectedCenter ? 1 : 0) + selectedTags.length;

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onTagChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header 行：左側標題 + 中間搜尋 + 右側展開 */}
      <div className="flex items-center gap-2 p-3">
        {/* 左：篩選條件標題 */}
        <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
          </div>
          <span className="font-medium text-gray-700 text-sm">篩選條件</span>
          {activeFiltersCount > 0 && (
            <span className="bg-rose-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>

        {/* 中：搜尋框（彈性寬度） */}
        {onSearchChange && (
          <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="搜尋機構、地點..."
              onChange={onSearchChange}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 transition-all"
            />
          </div>
        )}

        {/* 右：展開/收合按鈕 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* 展開的內容 */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 space-y-5 bg-gray-50/30">
          {/* 地區選擇 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">地區</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {onCenterChange && !regionUseLinks ? (
                // In-page 模式：用 state 控制（首頁、地區頁）
                <>
                  <button
                    onClick={() => onCenterChange(null)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      !selectedCenter && !activeRegionSlug
                        ? "bg-gray-900 text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {!selectedCenter && !activeRegionSlug && <Check className="w-3.5 h-3.5" />}
                    全部
                  </button>
                  {REGIONS.map((region) => {
                    const isActive =
                      selectedCenter === region.centerFilter ||
                      (!selectedCenter && activeRegionSlug === region.slug);
                    return (
                      <button
                        key={region.slug}
                        onClick={() => onCenterChange(selectedCenter === region.centerFilter ? null : region.centerFilter)}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                          isActive
                            ? "bg-gray-900 text-white shadow-sm"
                            : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isActive && <Check className="w-3.5 h-3.5" />}
                        {region.displayName}
                      </button>
                    );
                  })}
                </>
              ) : (
                // URL 模式：跳頁（城市頁、地區子頁）
                <>
                  <Link
                    href="/"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      !activeRegionSlug
                        ? "bg-gray-900 text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {!activeRegionSlug && <Check className="w-3.5 h-3.5" />}
                    全部
                  </Link>
                  {REGIONS.map((region) => (
                    <Link
                      key={region.slug}
                      href={`/region/${region.slug}`}
                      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        activeRegionSlug === region.slug
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {activeRegionSlug === region.slug && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {region.displayName}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* 縣市連結 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">縣市</span>
              <span className="text-xs text-gray-400">（查看各縣市專頁）</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/city/${city.slug}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentCitySlug === city.slug
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-red-300 hover:bg-red-50"
                  }`}
                >
                  {city.displayName}
                </Link>
              ))}
            </div>
          </div>

          {/* 贈品類型選擇 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">
                  贈品類型
                </span>
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => onTagChange([])}
                  className="text-xs text-gray-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  清除全部
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {GIFT_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                const IconComponent = tag.icon;
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-rose-500 text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-rose-300 hover:bg-rose-50"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
