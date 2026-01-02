"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Navigation, Loader2, AlertCircle } from "lucide-react";
import { NearbyLocation } from "@/hooks/useNearbyLocations";

interface NearbyLocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  locations: NearbyLocation[];
}

export default function NearbyLocationsModal({
  isOpen,
  onClose,
  isLoading,
  error,
  locations,
}: NearbyLocationsModalProps) {
  const openGoogleMaps = (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location
    )}`;
    window.open(url, "_blank");
  };

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `約 ${Math.round(km * 1000)}m`;
    }
    return `約 ${km.toFixed(1)}km`;
  };

  // 排名徽章顏色
  const rankBadgeColor = (index: number) => {
    if (index === 0) return "bg-amber-500 text-white"; // 金
    if (index === 1) return "bg-gray-400 text-white"; // 銀
    return "bg-orange-400 text-white"; // 銅
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5 text-red-500" />
            附近的捐血活動
          </DialogTitle>
        </DialogHeader>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <p className="text-sm text-gray-500">定位中...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        )}

        {/* Results - 簡潔表格式 */}
        {!isLoading && !error && locations.length > 0 && (
          <div className="space-y-2">
            {locations.map((item, index) => {
              const tags = item.event.tags || item.event.pttData?.tags || [];

              return (
                <div
                  key={item.event.id || index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => openGoogleMaps(item.event.location)}
                >
                  {/* 排名 */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankBadgeColor(
                      index
                    )}`}
                  >
                    {index + 1}
                  </div>

                  {/* 主要資訊 */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    {/* 機構名 - 可換行 */}
                    <div className="font-semibold text-gray-900 text-sm leading-tight">
                      {item.event.organization}
                    </div>

                    {/* 日期 + 時間 + 距離 */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {item.event.activityDate}
                        {item.event.time && ` · ${item.event.time}`}
                      </span>
                      <span className="text-blue-600 font-bold text-xs ml-2 flex-shrink-0">
                        {formatDistance(item.distance)}
                      </span>
                    </div>

                    {/* 禮物標籤 */}
                    {tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <p className="text-xs text-center text-gray-400 pt-2">
              點擊任一項目開啟 Google Maps
            </p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && locations.length === 0 && (
          <div className="flex flex-col items-center py-8 text-gray-500">
            <Navigation className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm">沒有可用的活動地點</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
