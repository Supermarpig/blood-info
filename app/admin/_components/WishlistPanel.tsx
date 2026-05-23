"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminIssue, IssueState } from "./types";
import { STATE_LABEL, STATE_STYLE } from "./types";

const FILTERS: { value: IssueState; label: string }[] = [
  { value: "open", label: "待處理" },
  { value: "closed", label: "已處理" },
];

export default function WishlistPanel() {
  const [filter, setFilter] = useState<IssueState>("open");
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/reports?label=wishlist&state=${filter}`
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
          {issues.map((it) => (
            <li
              key={it.number}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
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

              <p className="text-sm font-medium text-gray-900">
                {it.title.replace(/^\[許願\]\s*/, "")}
              </p>
              {it.body ? (
                <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600 line-clamp-4">
                  {it.body}
                </p>
              ) : null}

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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
