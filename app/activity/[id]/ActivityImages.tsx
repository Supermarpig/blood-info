"use client";

/**
 * 活動圖片區：PTT 海報 / 使用者回報的圖 / 通過審核的投稿海報。
 *
 * 沒有圖的場次不會留白，改成邀請投稿——幾千場活動只有純文字，
 * 而海報上才有贈品長相與詳細時間，主辦單位和到過現場的人手上就有這張圖。
 */

import { useState } from "react";
import { ImageUp } from "lucide-react";
import EventPosterUploadModal from "@/components/EventPosterUploadModal";
import { useEventPosters } from "@/lib/useEventPosters";

export function ActivityImages({
  images,
  organization,
  eventId,
  eventLabel,
}: {
  images: string[];
  organization: string;
  eventId: string;
  eventLabel: string;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const posterImages = useEventPosters(eventId);
  const allImages = [...images, ...posterImages];

  return (
    <div className="border-t border-gray-100 p-5 space-y-3">
      {allImages.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${organization} 活動圖片 ${i + 1}`}
            className="w-full h-auto object-contain"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => setUploadOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-3 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
      >
        <ImageUp className="h-4 w-4 text-gray-400" />
        {allImages.length > 0 ? "還有別張海報？幫忙上傳" : "有這場的海報嗎？幫忙上傳"}
      </button>

      <EventPosterUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        eventId={eventId}
        eventLabel={eventLabel}
      />
    </div>
  );
}
