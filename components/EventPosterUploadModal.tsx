"use client";

/**
 * 「上傳活動海報」——每一場活動都能被投稿海報。
 *
 * 為什麼要有：只有被 PTT 貼過的場次才有海報圖，其餘幾千場都只有純文字，
 * 但海報上才有贈品長相、詳細時間、地點示意。主辦單位手上本來就有這張圖，
 * 捐血人現場也拍得到——缺的只是一個上傳的地方。
 *
 * 流程刻意壓到最短（很多回報者是長輩）：選圖 → 送出。沒有其他欄位。
 * 圖片先進 /api/upload-image-public（Cloudinary），再把網址送進 /api/event-posters
 * 等待審核；通過後就跟 PTT 海報顯示在同一個地方。
 */

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, ImagePlus, X, Check, ImageUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { invalidateEventPosters } from "@/lib/useEventPosters";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  /** 給後台辨識用的活動描述（機構/地點/日期） */
  eventLabel: string;
}

/** 投稿者權杖：與現場回報共用同一把，之後要顯示「你投的那張」時對得起來 */
function getSubmitterToken(): string {
  try {
    let token = localStorage.getItem("onsite_token") || "";
    if (!token) {
      token =
        (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
        Math.random().toString(36).slice(2);
      localStorage.setItem("onsite_token", token);
    }
    return token;
  } catch {
    return "";
  }
}

export default function EventPosterUploadModal({
  open,
  onOpenChange,
  eventId,
  eventLabel,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setDone(false);
    setSubmitting(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      setError("圖片不能超過 5MB");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError(null);
  };

  const submit = async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/upload-image-public", {
        method: "POST",
        body: form,
      });
      const uploaded = await uploadRes.json();
      if (!uploadRes.ok || !uploaded.url) {
        setError(uploaded.error || "圖片上傳失敗，請再試一次");
        return;
      }

      const res = await fetch("/api/event-posters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          imageUrl: uploaded.url,
          eventLabel,
          submitterToken: getSubmitterToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "送出失敗，請稍後再試");
        return;
      }
      invalidateEventPosters(eventId);
      setDone(true);
    } catch {
      setError("送出失敗，請檢查網路後再試一次");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>上傳活動海報</DialogTitle>
          <DialogDescription className="text-left">
            {eventLabel}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Check className="h-10 w-10 text-emerald-500" />
            <p className="text-base font-medium text-gray-900">收到了，謝謝你</p>
            <p className="text-sm text-gray-500">
              我們看過之後就會顯示在這場活動上，讓後面的人看得到。
            </p>
            <Button variant="outline" onClick={() => handleClose(false)}>
              關閉
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSelect}
              disabled={submitting}
            />

            {preview ? (
              <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <div className="relative h-64 w-full">
                  <Image
                    src={preview}
                    alt="海報預覽"
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
                {!submitting && (
                  <button
                    type="button"
                    onClick={reset}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                    aria-label="移除圖片"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">點這裡選一張海報照片</span>
                <span className="text-xs text-gray-400">最大 5MB</span>
              </button>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <p className="text-xs leading-relaxed text-gray-500">
              海報上如果有贈品、時間、地點，其他捐血人就不必自己猜。送出後我們會先看過再公開。
            </p>

            <Button
              onClick={submit}
              disabled={!file || submitting}
              className="h-11 w-full gap-2 text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  上傳中...
                </>
              ) : (
                <>
                  <ImageUp className="h-4 w-4" />
                  送出海報
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
