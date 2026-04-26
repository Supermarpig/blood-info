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

export interface UserLocation {
  lat: number;
  lng: number;
}

interface UseNearbyLocationsReturn {
  isLoading: boolean;
  error: string | null;
  nearbyLocations: NearbyLocation[];
  userLocation: UserLocation | null;
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
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const findNearbyLocations = useCallback(async (events: DonationEvent[]) => {
    setIsLoading(true);
    setError(null);
    setNearbyLocations([]);

    try {
      // 1. 取得用戶位置
      const position = await getUserLocation();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      setUserLocation({ lat: userLat, lng: userLng });

      // 2. 篩選有經緯度資料的事件
      const eventsWithCoords = events.filter(
        (event) => event.coordinates?.lat && event.coordinates?.lng
      );

      // 3. 載入固定捐血室座標，作為補充（若事件資料不足時也能顯示）
      let staticRooms: DonationEvent[] = [];
      try {
        const res = await fetch("/api/blood-rooms");
        if (res.ok) {
          const json = await res.json();
          const today = new Date().toISOString().split("T")[0];
          staticRooms = (
            json.rooms as { name: string; lat: number; lng: number }[]
          ).map((r) => ({
            location: r.name,
            organization: "捐血室",
            time: "",
            rawContent: r.name,
            activityDate: today,
            coordinates: { lat: r.lat, lng: r.lng },
          }));
        }
      } catch {
        // 靜默失敗，靜態捐血室資料僅為補充
      }

      // 事件優先，靜態捐血室作為補充（後續去重會過濾座標重複者）
      const allSources = [...eventsWithCoords, ...staticRooms];

      if (allSources.length === 0) {
        setError("地點資料尚未準備完成，請稍後再試");
        return;
      }

      // 4. 計算距離並排序
      const locationsWithDistance: NearbyLocation[] = allSources.map(
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

      locationsWithDistance.sort((a, b) => a.distance - b.distance);

      // deduplicate by coordinates — same physical spot = same pin
      const seen = new Set<string>();
      const unique = locationsWithDistance.filter(({ event }) => {
        const key = `${event.coordinates!.lat.toFixed(5)},${event.coordinates!.lng.toFixed(5)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setNearbyLocations(unique.slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setNearbyLocations([]);
    setUserLocation(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    nearbyLocations,
    userLocation,
    findNearbyLocations,
    clearResults,
  };
}
