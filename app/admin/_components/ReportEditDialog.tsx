"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { AdminIssue, ParsedDonation } from "./types";

interface Props {
  issue: AdminIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EMPTY: ParsedDonation = {
  address: "",
  activityDate: "",
  time: "",
  tags: [],
  imgurUrl: "",
  email: "",
};

export default function ReportEditDialog({
  issue,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ParsedDonation>(EMPTY);
  const [lastNumber, setLastNumber] = useState<number | null>(null);

  // 每次開啟新的 issue 時同步初值
  if (issue && issue.number !== lastNumber) {
    setLastNumber(issue.number);
    setForm(issue.parsed ? { ...EMPTY, ...issue.parsed } : EMPTY);
    setError(null);
  }

  if (!issue) return null;

  const update = (patch: Partial<ParsedDonation>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${issue.number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "更新失敗");
        return;
      }
      onSaved();
      onOpenChange(false);
    } catch {
      setError("更新失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>編輯回報 #{issue.number}</DialogTitle>
          <DialogDescription>
            修改後按儲存，會直接更新該 GitHub Issue 的內容。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>地址</Label>
            <Input
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>日期 (YYYY-MM-DD)</Label>
              <Input
                value={form.activityDate}
                onChange={(e) => update({ activityDate: e.target.value })}
                placeholder="2026-05-30"
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
              value={form.tags.join(", ")}
              onChange={(e) =>
                update({
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="電影票, 超商"
            />
          </div>

          <div className="space-y-1.5">
            <Label>圖片網址</Label>
            <Input
              value={form.imgurUrl}
              onChange={(e) => update({ imgurUrl: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>通知 Email</Label>
            <Input
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "儲存"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
