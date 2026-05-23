"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const EMPTY = {
  address: "",
  activityDate: "",
  time: "",
  tags: "",
  imgurUrl: "",
  email: "",
};

export default function AddEventPanel() {
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const update = (patch: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedUrl(null);

    if (!form.address || !form.activityDate) {
      setError("請至少填寫地址與日期");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error || "新增失敗");
        return;
      }
      setCreatedUrl(data.data?.htmlUrl || null);
      setForm({ ...EMPTY });
    } catch {
      setError("新增失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          手動新增會建立一筆 <code>donation-report</code> GitHub Issue，與前台回報走相同流程；
          之後由 <code>pnpm importReports</code> 匯入到網站資料。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>地址 *</Label>
            <Input
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="例如：新北市板橋區中山路一段152號"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>日期 (YYYY-MM-DD) *</Label>
              <Input
                type="date"
                value={form.activityDate}
                onChange={(e) => update({ activityDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>作業時間</Label>
              <Input
                value={form.time}
                onChange={(e) => update({ time: e.target.value })}
                placeholder="09:00~17:00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>贈品標籤（逗號分隔）</Label>
            <Input
              value={form.tags}
              onChange={(e) => update({ tags: e.target.value })}
              placeholder="電影票, 超商"
            />
          </div>

          <div className="space-y-1.5">
            <Label>圖片網址</Label>
            <Input
              value={form.imgurUrl}
              onChange={(e) => update({ imgurUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>通知 Email</Label>
            <Input
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="選填"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "建立回報 Issue"
              )}
            </Button>
            {createdUrl && (
              <a
                href={createdUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-sm text-emerald-600"
              >
                <CheckCircle2 className="h-4 w-4" />
                已建立，前往查看
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
