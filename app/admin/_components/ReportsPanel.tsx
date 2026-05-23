"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  RotateCcw,
  Pencil,
  Loader2,
  RefreshCw,
  CalendarDays,
  MapPin,
  Clock,
  ExternalLink,
  Inbox,
  Search,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { AdminIssue, IssueState } from "./types";
import { STATE_LABEL, STATE_STYLE } from "./types";
import ReportEditDialog from "./ReportEditDialog";
import ImageLightbox from "./ImageLightbox";

const FILTERS: { value: IssueState; label: string }[] = [
  { value: "open", label: "待處理" },
  { value: "closed", label: "已處理" },
];

export default function ReportsPanel({
  onChanged,
}: {
  onChanged?: () => void;
}) {
  const [filter, setFilter] = useState<IssueState>("open");
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [editing, setEditing] = useState<AdminIssue | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const res = await fetch(
        `/api/admin/reports?label=donation-report&state=${filter}`
      );
      const data = await res.json();
      if (data.success) {
        setIssues(data.data);
      } else {
        setIssues([]);
        setError(data.error || "讀取失敗");
      }
    } catch {
      setIssues([]);
      setError("讀取失敗");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return issues;
    return issues.filter((it) => {
      const p = it.parsed;
      const haystack = [
        it.title,
        p?.address,
        p?.activityDate,
        p?.time,
        ...(p?.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [issues, query]);

  const setState = async (n: number, state: IssueState) => {
    setBusy(n);
    try {
      await fetch(`/api/admin/reports/${n}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      await load();
      onChanged?.();
    } finally {
      setBusy(null);
    }
  };

  const bulkSetState = async (state: IssueState) => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        [...selected].map((n) =>
          fetch(`/api/admin/reports/${n}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state }),
          })
        )
      );
      await load();
      onChanged?.();
    } finally {
      setBulkBusy(false);
    }
  };

  const toggle = (n: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const allSelected =
    filtered.length > 0 && filtered.every((it) => selected.has(it.number));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((it) => it.number)));

  const publish = async () => {
    if (
      !confirm(
        "確定要發佈嗎？\n會觸發 GitHub Action 把待處理的回報匯入網站資料並建立 PR，合併後上線。"
      )
    )
      return;
    setPublishing(true);
    setPublishMsg(null);
    try {
      const res = await fetch("/api/admin/publish", { method: "POST" });
      const data = await res.json();
      setPublishMsg(
        data.success
          ? "✅ 已觸發匯入，稍後到 GitHub Actions / PR 查看。"
          : `❌ ${data.error || "觸發失敗"}`
      );
    } catch {
      setPublishMsg("❌ 觸發失敗，請稍後再試");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      {/* 工具列 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
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

        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋地址 / 日期 / 贈品"
            className="h-9 w-44 pl-8 sm:w-56"
          />
        </div>

        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          onClick={publish}
          disabled={publishing}
        >
          {publishing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          發佈到網站
        </Button>

        <Button variant="ghost" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          重新整理
        </Button>
      </div>

      {publishMsg && (
        <p className="mb-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {publishMsg}
        </p>
      )}
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* 批次操作列 */}
      {!loading && filtered.length > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            <span className="text-gray-600">全選</span>
          </label>
          <span className="text-gray-400">
            已選 {selected.size} / {filtered.length} 筆
          </span>
          {selected.size > 0 && (
            <div className="ml-auto flex gap-2">
              {filter === "open" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-emerald-600"
                  disabled={bulkBusy}
                  onClick={() => bulkSetState("closed")}
                >
                  {bulkBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  批次標記完成
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-gray-600"
                  disabled={bulkBusy}
                  onClick={() => bulkSetState("open")}
                >
                  {bulkBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  批次重新開啟
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Inbox className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">
            {query
              ? "沒有符合搜尋的回報"
              : filter === "open"
                ? "目前沒有待處理的回報 🎉"
                : "沒有已處理的回報"}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((it) => {
            const p = it.parsed;
            const checked = selected.has(it.number);
            return (
              <li
                key={it.number}
                className={`rounded-lg border bg-white p-4 shadow-sm transition-colors ${
                  checked ? "border-red-300 ring-1 ring-red-200" : "border-gray-200"
                }`}
              >
                <div className="flex gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(it.number)}
                    className="mt-1"
                  />

                  {p?.imgurUrl ? (
                    <button
                      type="button"
                      onClick={() => setLightbox(p.imgurUrl)}
                      className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100"
                    >
                      <Image
                        src={p.imgurUrl}
                        alt={p.address}
                        fill
                        sizes="80px"
                        className="object-cover transition-transform hover:scale-105"
                        unoptimized
                      />
                    </button>
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLE[it.state]}`}
                      >
                        {STATE_LABEL[it.state]}
                      </span>
                      <span className="text-xs text-gray-400">
                        #{it.number} · {it.user}
                      </span>
                    </div>

                    <p className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {p?.address || it.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {p?.activityDate ? (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {p.activityDate}
                        </span>
                      ) : null}
                      {p?.time ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {p.time}
                        </span>
                      ) : null}
                      {p?.email ? <span>📧 {p.email}</span> : null}
                    </div>

                    {p?.tags?.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-pink-50 px-2 py-0.5 text-xs text-pink-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {!p ? (
                      <p className="mt-1.5 text-xs text-amber-600">
                        無法解析結構化欄位，請點「在 GitHub 開啟」查看原始內容。
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3">
                  <a
                    href={it.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mr-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />在 GitHub 開啟
                  </a>

                  {it.state === "open" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-emerald-600 hover:text-emerald-700"
                      disabled={busy === it.number}
                      onClick={() => setState(it.number, "closed")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      標記處理完成
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-gray-600"
                      disabled={busy === it.number}
                      onClick={() => setState(it.number, "open")}
                    >
                      <RotateCcw className="h-4 w-4" />
                      重新開啟
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={busy === it.number || !p}
                    onClick={() => {
                      setEditing(it);
                      setEditOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    編輯
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ReportEditDialog
        issue={editing}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={load}
      />
      <ImageLightbox
        src={lightbox}
        open={!!lightbox}
        onOpenChange={(o) => !o && setLightbox(null)}
      />
    </div>
  );
}
