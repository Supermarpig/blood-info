"use client";

/**
 * 後台「海報審核」：使用者/主辦單位投稿的活動海報，通過後才會顯示在活動上。
 * 版型與操作沿用 OnsiteReportsPanel，差別是這裡只有一張圖要看——
 * 所以圖放大一點，讓「是不是這場的海報」一眼判斷得出來。
 */

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  X,
  Trash2,
  RotateCcw,
  Loader2,
  RefreshCw,
  ExternalLink,
  Inbox,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type Moderation = "pending" | "approved" | "rejected";

interface AdminEventPoster {
  id: string;
  eventId: string;
  imageUrl: string;
  eventLabel: string;
  moderation: Moderation;
  createdAt: string;
}

const FILTERS: { value: Moderation; label: string }[] = [
  { value: "pending", label: "待審" },
  { value: "approved", label: "已公開" },
  { value: "rejected", label: "已退回" },
];

export default function EventPostersPanel({
  onChanged,
}: {
  onChanged?: () => void;
}) {
  const [filter, setFilter] = useState<Moderation>("pending");
  const [items, setItems] = useState<AdminEventPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/event-posters?moderation=${filter}`);
      const data = await res.json();
      if (data.success) setItems(data.data);
      else {
        setItems([]);
        setError(data.error || "讀取失敗");
      }
    } catch {
      setItems([]);
      setError("讀取失敗");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (id: string, moderation: Moderation) => {
    setBusy(id);
    try {
      await fetch(`/api/admin/event-posters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moderation }),
      });
      await load();
      onChanged?.();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("確定刪除這筆海報投稿？此操作無法復原。")) return;
    setBusy(id);
    try {
      await fetch(`/api/admin/event-posters/${id}`, { method: "DELETE" });
      await load();
      onChanged?.();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <span className="text-xs text-gray-400">共 {items.length} 筆</span>
          )}
          <Button variant="ghost" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            重新整理
          </Button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Inbox className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">
            {filter === "pending" ? "目前沒有待審的海報" : "沒有資料"}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {it.eventLabel || it.eventId}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(it.createdAt).toLocaleString("zh-TW")}
                </span>
              </div>

              <a
                href={it.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="relative mt-1 block h-56 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              >
                <Image
                  src={it.imageUrl}
                  alt="投稿海報"
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-contain"
                />
              </a>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <a
                  href={`/activity/${it.eventId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mr-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  看活動頁
                </a>

                {it.moderation !== "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-emerald-600 hover:text-emerald-700"
                    disabled={busy === it.id}
                    onClick={() => moderate(it.id, "approved")}
                  >
                    <Check className="h-4 w-4" />
                    通過公開
                  </Button>
                )}
                {it.moderation !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-gray-600"
                    disabled={busy === it.id}
                    onClick={() => moderate(it.id, "rejected")}
                  >
                    {it.moderation === "approved" ? (
                      <RotateCcw className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    退回隱藏
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-red-600 hover:text-red-700"
                  disabled={busy === it.id}
                  onClick={() => remove(it.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  刪除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
