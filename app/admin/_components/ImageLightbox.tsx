"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Props {
  src: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alt?: string;
}

export default function ImageLightbox({ src, open, onOpenChange, alt }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-auto max-w-[92vw] border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">圖片預覽</DialogTitle>
        {src ? (
          <div className="flex items-center justify-center">
            {/* 任意外部網域圖片，直接用 img 不經 next/image 最佳化 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt || "預覽"}
              className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
