"use client";

/**
 * 取得某場活動「已審核通過」的投稿海報。
 *
 * 為什麼要自己做批次：清單頁一次會掛三十張卡，若每張卡各打一次 API，
 * 一次瀏覽就是三十個 Workers 請求（本站對這件事很敏感，見 components/Link.tsx
 * 關掉 prefetch 的理由）。這裡把同一批 mount 的卡片收集起來，
 * 一個 microtask 之後合併成一次請求，之後由模組層的快取直接命中。
 */

import { useEffect, useState } from "react";

const cache = new Map<string, string[]>();
const pending = new Set<string>();
const waiters = new Map<string, ((images: string[]) => void)[]>();
let scheduled = false;

/** 一次請求最多帶幾個 id（與 API 的上限一致，網址也不會太長） */
const BATCH_SIZE = 60;

async function flush() {
  scheduled = false;
  const ids = Array.from(pending).slice(0, BATCH_SIZE);
  ids.forEach((id) => pending.delete(id));
  if (ids.length === 0) return;
  if (pending.size > 0) schedule(); // 超過一批的留到下一輪

  let posters: Record<string, string[]> = {};
  try {
    const res = await fetch(
      `/api/event-posters?eventIds=${encodeURIComponent(ids.join(","))}`
    );
    const data = await res.json();
    if (data && typeof data.posters === "object") posters = data.posters;
  } catch {
    /* 海報是加分內容，抓不到就當作沒有 */
  }

  for (const id of ids) {
    const images = posters[id] || [];
    cache.set(id, images);
    waiters.get(id)?.forEach((resolve) => resolve(images));
    waiters.delete(id);
  }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  // 用 timeout 而非 microtask：讓同一次 render 掛上來的所有卡片都進得了同一批
  setTimeout(flush, 50);
}

function request(eventId: string): Promise<string[]> {
  const cached = cache.get(eventId);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const list = waiters.get(eventId) || [];
    list.push(resolve);
    waiters.set(eventId, list);
    pending.add(eventId);
    schedule();
  });
}

/** 讓剛上傳/剛審核完的結果能重新抓一次 */
export function invalidateEventPosters(eventId: string) {
  cache.delete(eventId);
}

export function useEventPosters(eventId?: string | null): string[] {
  const [images, setImages] = useState<string[]>(
    () => (eventId && cache.get(eventId)) || []
  );

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    request(eventId).then((result) => {
      if (alive) setImages(result);
    });
    return () => {
      alive = false;
    };
  }, [eventId]);

  return images;
}
