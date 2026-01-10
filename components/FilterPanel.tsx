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
} from "lucide-react";
import { REGIONS } from "@/lib/regionConfig";

interface FilterPanelProps {
  currentRegionSlug?: string;
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
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
  selectedTags,
  onTagChange,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = (currentRegionSlug ? 1 : 0) + selectedTags.length;

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onTagChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 收合狀態的 Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
          </div>
          <span className="font-medium text-gray-700">篩選條件</span>
          {activeFiltersCount > 0 && (
            <span className="bg-rose-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 已選擇的 pills（收合時顯示） */}
          {!isExpanded && selectedTags.length > 0 && (
            <div className="flex gap-1.5 max-w-[180px] overflow-hidden">
              {selectedTags.slice(0, 2).map((tagId) => {
                const tag = GIFT_TAGS.find((t) => t.id === tagId);
                return (
                  <span
                    key={tagId}
                    className="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-md whitespace-nowrap font-medium"
                  >
                    {tag?.label || tagId}
                  </span>
                );
              })}
              {selectedTags.length > 2 && (
                <span className="text-xs text-gray-400 font-medium">
                  +{selectedTags.length - 2}
                </span>
              )}
            </div>
          )}
          <div className="w-6 h-6 flex items-center justify-center">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

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
              <Link
                href="/"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  !currentRegionSlug
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
              >
                {!currentRegionSlug && <Check className="w-3.5 h-3.5" />}
                全部
              </Link>
              {REGIONS.map((region) => (
                <Link
                  key={region.slug}
                  href={`/region/${region.slug}`}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    currentRegionSlug === region.slug
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {currentRegionSlug === region.slug && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {region.displayName}
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
