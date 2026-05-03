"use client";

export function ActivityImages({ images, organization }: { images: string[]; organization: string }) {
  if (images.length === 0) return null;
  return (
    <div className="border-t border-gray-100 p-5 space-y-3">
      {images.map((src, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${organization} 活動圖片 ${i + 1}`}
            className="w-full h-auto object-contain"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      ))}
    </div>
  );
}
