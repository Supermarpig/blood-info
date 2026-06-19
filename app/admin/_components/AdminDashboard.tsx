"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  Lightbulb,
  PlusCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Megaphone,
  DatabaseZap,
  MapPin,
} from "lucide-react";
import ReportsPanel from "./ReportsPanel";
import WishlistPanel from "./WishlistPanel";
import AddEventPanel from "./AddEventPanel";
import AnnouncementPanel from "./AnnouncementPanel";
import OnsiteReportsPanel from "./OnsiteReportsPanel";

interface Stats {
  reportsPending: number;
  reportsDone: number;
  wishlistPending: number;
  wishlistDone: number;
}

function StatCard({
  icon,
  label,
  value,
  accent,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        {loading ? (
          <Loader2 className="mt-1 h-4 w-4 animate-spin text-gray-300" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
}

function Badge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
      {count}
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [onsitePending, setOnsitePending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const [statsRes, onsiteRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/onsite-reports?moderation=pending"),
      ]);
      const data = await statsRes.json();
      if (data.success) setStats(data.data);
      const onsite = await onsiteRes.json();
      if (onsite.success) setOnsitePending(onsite.counts?.pending ?? 0);
    } catch {
      // 統計失敗不影響主要功能
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const clearCache = async () => {
    setClearing(true);
    setClearMsg(null);
    try {
      const res = await fetch("/api/admin/clear-cache", { method: "POST" });
      const data = await res.json();
      setClearMsg(data.success ? "✅ 已清除快取" : `❌ ${data.error || "失敗"}`);
      loadStats();
    } catch {
      setClearMsg("❌ 清除失敗");
    } finally {
      setClearing(false);
      setTimeout(() => setClearMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-3">
        {clearMsg && <span className="text-sm text-gray-600">{clearMsg}</span>}
        <button
          onClick={clearCache}
          disabled={clearing}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
          title="清除公告與捐血活動的伺服器記憶體快取"
        >
          {clearing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DatabaseZap className="h-4 w-4" />
          )}
          清除快取
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          accent="bg-amber-100"
          label="待處理回報"
          value={stats?.reportsPending ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          accent="bg-emerald-100"
          label="已處理回報"
          value={stats?.reportsDone ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<Lightbulb className="h-5 w-5 text-blue-600" />}
          accent="bg-blue-100"
          label="待處理許願"
          value={stats?.wishlistPending ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-gray-500" />}
          accent="bg-gray-100"
          label="已處理許願"
          value={stats?.wishlistDone ?? 0}
          loading={loading}
        />
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="reports" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            回報審核
            <Badge count={stats?.reportsPending} />
          </TabsTrigger>
          <TabsTrigger value="onsite" className="gap-1.5">
            <MapPin className="h-4 w-4" />
            現場真相
            <Badge count={onsitePending} />
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-1.5">
            <Lightbulb className="h-4 w-4" />
            功能許願
            <Badge count={stats?.wishlistPending} />
          </TabsTrigger>
          <TabsTrigger value="add" className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            手動新增
          </TabsTrigger>
          <TabsTrigger value="announcement" className="gap-1.5">
            <Megaphone className="h-4 w-4" />
            公告
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4">
          <ReportsPanel onChanged={loadStats} />
        </TabsContent>

        <TabsContent value="onsite" className="mt-4">
          <OnsiteReportsPanel onChanged={loadStats} />
        </TabsContent>

        <TabsContent value="wishlist" className="mt-4">
          <WishlistPanel onChanged={loadStats} />
        </TabsContent>

        <TabsContent value="add" className="mt-4">
          <AddEventPanel onChanged={loadStats} />
        </TabsContent>

        <TabsContent value="announcement" className="mt-4">
          <AnnouncementPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
