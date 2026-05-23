"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminIssue, IssueState } from "./types";
import { STATE_LABEL, STATE_STYLE } from "./types";
import ReportEditDialog from "./ReportEditDialog";

const FILTERS: { value: IssueState; label: string }[] = [
  { value: "open", label: "待處理" },
  { value: "closed", label: "已處理" },
];

export default function ReportsPanel() {
  const [filter, setFilter] = useState<IssueState>("open");
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [editing, setEditing] = useState<AdminIssue | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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

  const setState = async (n: number, state: IssueState) => {
    setBusy(n);
    try {
      await fetch(`/api/admin/reports/${n}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      await load();
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
        <Button variant="ghost" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          重新整理
        </Button>
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
      ) : issues.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">沒有資料</p>
      ) : (
        <ul className="space-y-3">
          {issues.map((it) => {
            const p = it.parsed;
            return (
              <li
                key={it.number}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  {p?.imgurUrl ? (
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <Image
                        src={p.imgurUrl}
                        alt={p.address}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
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
    </div>
  );
}
