"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Trash2, Droplets, Calendar, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DonationType = "全血" | "血小板" | "血漿" | "成分血";

interface BloodRecord {
  id: string;
  date: string;
  type: DonationType;
  location?: string;
  note?: string;
}

const STORAGE_KEY = "blood_records";
const WAIT_DAYS: Record<DonationType, number> = {
  全血: 56,
  血小板: 14,
  血漿: 14,
  成分血: 14,
};

function loadRecords(): BloodRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BloodRecord[]) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: BloodRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

function formatDate(dateStr: string): string {
  const [y, m, day] = dateStr.split("-");
  return `${y} 年 ${parseInt(m)} 月 ${parseInt(day)} 日`;
}

function daysFromNow(dateStr: string): number {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
  const diff = new Date(dateStr).getTime() - new Date(today).getTime();
  return Math.ceil(diff / 86400000);
}

const TYPE_OPTIONS: DonationType[] = ["全血", "血小板", "血漿", "成分血"];

export default function RecordClient() {
  const [records, setRecords] = useState<BloodRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // form state
  const [formDate, setFormDate] = useState(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" })
  );
  const [formType, setFormType] = useState<DonationType>("全血");
  const [formLocation, setFormLocation] = useState("");
  const [formNote, setFormNote] = useState("");

  useEffect(() => {
    setMounted(true);
    setRecords(loadRecords());
  }, []);

  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const nextDate = latest ? addDays(latest.date, WAIT_DAYS[latest.type]) : null;
  const daysLeft = nextDate ? daysFromNow(nextDate) : null;

  const handleAdd = () => {
    if (!formDate) return;
    const newRecord: BloodRecord = {
      id: crypto.randomUUID(),
      date: formDate,
      type: formType,
      location: formLocation.trim() || undefined,
      note: formNote.trim() || undefined,
    };
    const updated = [...records, newRecord];
    setRecords(updated);
    saveRecords(updated);
    setOpen(false);
    setFormLocation("");
    setFormNote("");
    setFormType("全血");
    setFormDate(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("確定要刪除這筆紀錄嗎？")) return;
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    saveRecords(updated);
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">首頁</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">捐血紀錄本</span>
      </nav>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">捐血紀錄本</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-red-500 hover:bg-red-600 text-white">
              <Plus className="w-4 h-4" />
              新增紀錄
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增捐血紀錄</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  捐血日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  max={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  捐血類型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as DonationType)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}（間隔 {WAIT_DAYS[t]} 天）
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  捐血地點（選填）
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="例如：台北捐血中心"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備註（選填）
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="例如：贈品、身體狀況..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleAdd}
                  disabled={!formDate}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  儲存
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        紀錄存於您的裝置，不會上傳到任何伺服器
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-red-50 rounded-2xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-red-400">
            <Droplets className="w-4 h-4" />
            <span className="text-xs font-medium">累積次數</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{records.length}</p>
          <p className="text-xs text-red-400">次捐血紀錄</p>
        </div>

        <div className={`rounded-2xl p-4 flex flex-col gap-1 ${
          daysLeft === null
            ? "bg-gray-50"
            : daysLeft <= 0
            ? "bg-green-50"
            : "bg-blue-50"
        }`}>
          <div className={`flex items-center gap-2 ${
            daysLeft === null ? "text-gray-400" : daysLeft <= 0 ? "text-green-500" : "text-blue-400"
          }`}>
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">下次可捐</span>
          </div>
          {daysLeft === null ? (
            <p className="text-sm text-gray-400 mt-1">尚無紀錄</p>
          ) : daysLeft <= 0 ? (
            <>
              <p className="text-2xl font-bold text-green-600">可以捐了！</p>
              <p className="text-xs text-green-500">
                {latest && `最近：${formatDate(latest.date)}`}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-blue-600">{daysLeft}</p>
              <p className="text-xs text-blue-400">天後可捐（{nextDate}）</p>
            </>
          )}
        </div>
      </div>

      {/* Record list */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Droplets className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>還沒有捐血紀錄</p>
          <p className="text-sm mt-1">按右上角「新增紀錄」開始記錄</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">捐血紀錄</h2>
          {sorted.map((r) => {
            const next = addDays(r.date, WAIT_DAYS[r.type]);
            const left = daysFromNow(next);
            return (
              <div
                key={r.id}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      {r.type}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{r.date}</span>
                  </div>
                  {r.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                      <MapPin className="w-3 h-3" />
                      {r.location}
                    </div>
                  )}
                  {r.note && (
                    <p className="text-xs text-gray-400 truncate">{r.note}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    下次可捐：{next}
                    {left > 0 ? `（還有 ${left} 天）` : "（現在可捐）"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"
                  aria-label="刪除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-gray-100 text-center">
        <Link href="/recent" className="text-sm text-red-500 hover:text-red-600 transition-colors">
          查詢近期捐血活動 →
        </Link>
      </div>
    </div>
  );
}
