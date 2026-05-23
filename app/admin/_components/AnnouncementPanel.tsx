"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Announcement {
  enabled: boolean;
  title: string;
  message: string;
  spots: string[];
  gifts: string[];
  ctaText: string;
  ctaUrl: string;
  autoRecommend: boolean;
}

const EMPTY: Announcement = {
  enabled: false,
  title: "",
  message: "",
  spots: [],
  gifts: [],
  ctaText: "",
  ctaUrl: "",
  autoRecommend: true,
};

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={v}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="flex-shrink-0 text-red-600"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="h-4 w-4" />
        新增一項
      </Button>
    </div>
  );
}

export default function AnnouncementPanel() {
  const [form, setForm] = useState<Announcement>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/announcement");
        const data = await res.json();
        if (data.success) {
          const d = data.data;
          setForm({
            enabled: !!d.enabled,
            title: d.title || "",
            message: d.message || "",
            spots: d.spots || [],
            gifts: d.gifts || [],
            ctaText: d.ctaText || "",
            ctaUrl: d.ctaUrl || "",
            autoRecommend: d.autoRecommend !== false,
          });
        } else {
          setError(data.error || "讀取失敗");
        }
      } catch {
        setError("讀取失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (patch: Partial<Announcement>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          spots: form.spots.map((s) => s.trim()).filter(Boolean),
          gifts: form.gifts.map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "儲存失敗");
        return;
      }
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch {
      setError("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-red-500" />
            公告內容
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
              className="h-4 w-4 accent-red-500"
            />
            <span className="text-sm font-medium text-gray-700">
              在前台顯示公告（關閉則不會跳出）
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={form.autoRecommend}
              onChange={(e) => update({ autoRecommend: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-red-500"
            />
            <span className="text-sm text-gray-700">
              <span className="font-medium">啟用今日自動推薦</span>
              <span className="mt-0.5 block text-xs text-gray-400">
                上方沒填推薦地點時，前台會自動挑「今天、有贈品」的一間顯示；關閉則完全不自動推薦。
              </span>
            </span>
          </label>

          <div className="space-y-1.5">
            <Label>標題</Label>
            <Input
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="例如：本週捐血推薦 🩸"
            />
          </div>

          <div className="space-y-1.5">
            <Label>內文</Label>
            <Textarea
              value={form.message}
              onChange={(e) => update({ message: e.target.value })}
              rows={3}
              placeholder="例如：新功能上線、活動說明…"
            />
          </div>

          <ListEditor
            label="本週推薦捐血地點"
            items={form.spots}
            onChange={(spots) => update({ spots })}
            placeholder="例如：板橋捐血站"
          />

          <ListEditor
            label="本週主打贈品"
            items={form.gifts}
            onChange={(gifts) => update({ gifts })}
            placeholder="例如：電影票"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>按鈕文字（選填）</Label>
              <Input
                value={form.ctaText}
                onChange={(e) => update({ ctaText: e.target.value })}
                placeholder="例如：看完整活動"
              />
            </div>
            <div className="space-y-1.5">
              <Label>按鈕連結（選填）</Label>
              <Input
                value={form.ctaUrl}
                onChange={(e) => update({ ctaUrl: e.target.value })}
                placeholder="/recent 或 https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          儲存公告
        </Button>
        {done && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            已儲存（前台最多 5 分鐘後更新）
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
