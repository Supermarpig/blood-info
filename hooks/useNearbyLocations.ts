"use client";

import { useState, useCallback } from "react";

interface DonationEvent {
  id?: string;
  time: string;
  organization: string;
  location: string;
  rawContent: string;
  customNote?: string;
  activityDate: string;
  center?: string;
  detailUrl?: string;
  tags?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  pttData?: {
    rawLine: string;
    images: string[];
    url: string;
    tags?: string[];
  };
}

export interface NearbyLocation {
  event: DonationEvent;
  distance: number; // 公里
}

interface UseNearbyLocationsReturn {
  isLoading: boolean;
  error: string | null;
  nearbyLocations: NearbyLocation[];
  findNearbyLocations: (events: DonationEvent[]) => Promise<void>;
  clearResults: () => void;
}

/**
 * Haversine 公式計算兩點之間的距離（公里）
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 地球半徑（公里）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * 取得用戶當前位置
 */
function getUserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("瀏覽器不支援定位功能"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("請允許位置存取權限以使用此功能"));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("無法取得您的位置資訊"));
            break;
          case error.TIMEOUT:
            reject(new Error("取得位置逾時，請重試"));
            break;
          default:
            reject(new Error("定位發生未知錯誤"));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 快取 1 分鐘
      }
    );
  });
}

export function useNearbyLocations(): UseNearbyLocationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([]);

  const findNearbyLocations = useCallback(async (events: DonationEvent[]) => {
    setIsLoading(true);
    setError(null);
    setNearbyLocations([]);

    try {
      // 1. 取得用戶位置
      const position = await getUserLocation();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // 2. 篩選有經緯度資料的事件
      const eventsWithCoords = events.filter(
        (event) => event.coordinates?.lat && event.coordinates?.lng
      );

      if (eventsWithCoords.length === 0) {
        setError("地點資料尚未準備完成，請稍後再試");
        return;
      }

      // 3. 計算距離並排序
      const locationsWithDistance: NearbyLocation[] = eventsWithCoords.map(
        (event) => ({
          event,
          distance: calculateDistance(
            userLat,
            userLng,
            event.coordinates!.lat,
            event.coordinates!.lng
          ),
        })
      );

      // 4. 排序並取前三個
      locationsWithDistance.sort((a, b) => a.distance - b.distance);
      const top3 = locationsWithDistance.slice(0, 3);

      setNearbyLocations(top3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setNearbyLocations([]);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    nearbyLocations,
    findNearbyLocations,
    clearResults,
  };
}
