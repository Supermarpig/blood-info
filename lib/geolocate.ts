// /lib/geolocate.ts
//
// 定位取得座標的共用入口，重點是「不要被瀏覽器外掛玩死」。
//
// 為什麼不直接用 navigator.geolocation.getCurrentPosition：
// 市面上的「假定位 / location spoofing」外掛，為了跨過 isolated world，
// 會把頁面傳進去的 callback 用 eval(fn.toString()) 重建一份再執行。
// 重建後閉包整個不見，callback 裡碰到的 React state setter 全部變成
// ReferenceError（實測：setLocating is not defined），畫面就永遠卡在「定位中…」。
//
// 對策兩層：
//   1. 傳給瀏覽器的 callback 只准碰 window 上的信箱，被 eval 重建也還找得到路
//      回來（所以下面那兩個 callback 一定要寫死 window.__bloodInfoGeoBridge，
//      不能抽成變數，抽了原始碼裡就會出現找不到的識別字）。
//   2. 另外壓一個看門狗計時器，外掛把 callback 整個吃掉也一定會收到失敗，
//      不會有「按下去就沒有下文」的按鈕。

export const GEO_ERROR = {
  UNKNOWN: 0,
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
  UNSUPPORTED: 4,
} as const;

export interface GeoCoords {
  lat: number;
  lng: number;
}

export class GeolocateError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = "GeolocateError";
    this.code = code;
  }
}

const DEFAULT_MESSAGE: Record<number, string> = {
  [GEO_ERROR.PERMISSION_DENIED]: "沒有取得定位權限",
  [GEO_ERROR.POSITION_UNAVAILABLE]: "無法取得您的位置資訊",
  [GEO_ERROR.TIMEOUT]: "定位逾時，請重試",
  [GEO_ERROR.UNSUPPORTED]: "這支瀏覽器不支援定位",
  [GEO_ERROR.UNKNOWN]: "定位發生未知錯誤",
};

interface Waiter {
  ok: (position: unknown) => void;
  fail: (error: unknown) => void;
}

interface GeoBridge {
  waiting: Waiter[];
  deliver: (position: unknown, error: unknown) => void;
}

declare global {
  interface Window {
    __bloodInfoGeoBridge?: GeoBridge;
  }
}

/** window 上的信箱：真正的邏輯留在這裡，外掛不會重建它 */
function bridge(): GeoBridge {
  let box = window.__bloodInfoGeoBridge;
  if (!box) {
    box = {
      waiting: [],
      deliver(position, error) {
        const waiters = box!.waiting.splice(0);
        for (const waiter of waiters) {
          if (position) waiter.ok(position);
          else waiter.fail(error);
        }
      },
    };
    window.__bloodInfoGeoBridge = box;
  }
  return box;
}

function toGeolocateError(error: unknown): GeolocateError {
  const raw = error as { code?: number; message?: string } | null;
  const code =
    typeof raw?.code === "number" && raw.code >= 1 && raw.code <= 3
      ? raw.code
      : GEO_ERROR.UNKNOWN;
  return new GeolocateError(code, DEFAULT_MESSAGE[code]);
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000, // 快取 1 分鐘，避免重複彈授權
};

/**
 * 取得目前座標。成功回 { lat, lng }，失敗一律 throw GeolocateError（帶 code）。
 * 保證會有結果：就算瀏覽器 / 外掛兩個 callback 都不叫，看門狗也會讓它逾時。
 */
export function getCurrentPositionSafely(
  options: PositionOptions = DEFAULT_OPTIONS
): Promise<GeoCoords> {
  return new Promise<GeoCoords>((resolve, reject) => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      reject(
        new GeolocateError(
          GEO_ERROR.UNSUPPORTED,
          DEFAULT_MESSAGE[GEO_ERROR.UNSUPPORTED]
        )
      );
      return;
    }

    const box = bridge();
    let settled = false;

    const drop = () => {
      box.waiting = box.waiting.filter((w) => w !== waiter);
    };

    const waiter: Waiter = {
      ok(position) {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        const coords = (position as GeolocationPosition | null)?.coords;
        if (
          !coords ||
          typeof coords.latitude !== "number" ||
          typeof coords.longitude !== "number"
        ) {
          reject(
            new GeolocateError(
              GEO_ERROR.POSITION_UNAVAILABLE,
              DEFAULT_MESSAGE[GEO_ERROR.POSITION_UNAVAILABLE]
            )
          );
          return;
        }
        resolve({ lat: coords.latitude, lng: coords.longitude });
      },
      fail(error) {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        reject(toGeolocateError(error));
      },
    };

    // 看門狗：外掛把兩個 callback 都吃掉時，這裡負責讓呼叫端收到失敗
    const watchdog = setTimeout(() => {
      drop();
      waiter.fail({ code: GEO_ERROR.TIMEOUT });
    }, (options.timeout ?? 10000) + 2000);

    box.waiting.push(waiter);

    try {
      navigator.geolocation.getCurrentPosition(
        // 這兩個 callback 只能碰 window：被外掛 eval 重建後閉包會消失，
        // 寫死的 window.__bloodInfoGeoBridge 是唯一還回得來的路。
        function (position) {
          window.__bloodInfoGeoBridge?.deliver(position, null);
        },
        function (error) {
          window.__bloodInfoGeoBridge?.deliver(null, error);
        },
        options
      );
    } catch (error) {
      drop();
      waiter.fail(error);
    }
  });
}
