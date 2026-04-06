"use client";

import { useState } from "react";
import { Share2, Check, Copy, Clock, MapPin, Gift, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShareModalProps {
  organization: string;
  activityDate: string;
  time: string;
  location: string;
  giftNames: string[];
  shareUrl: string;
  showHint?: boolean;
}

export default function ShareModal({
  organization,
  activityDate,
  time,
  location,
  giftNames,
  shareUrl,
  showHint = false,
}: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getShareText = () => {
    const giftLine = giftNames.length > 0 ? `\n贈品：${giftNames.join("、")}` : "";
    return `【捐血活動】${organization}\n時間：${activityDate} ${time}\n地點：${location}${giftLine}\n\n詳細資訊：${shareUrl}`;
  };

  const handleLine = () => {
    const text = getShareText();
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleThreads = () => {
    const text = getShareText();
    window.open(
      `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleIG = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({ text, url: shareUrl });
        return;
      } catch {
        // cancelled or unsupported
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="分享這個活動"
          className="relative p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          {showHint && (
            <span className="absolute inset-0 rounded-full animate-ping bg-slate-400 opacity-30" />
          )}
          <Share2 className="relative w-4 h-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="block w-[calc(100%-2rem)] max-w-sm p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b bg-white">
          <DialogTitle className="text-gray-800 text-base">分享這個捐血活動</DialogTitle>
        </DialogHeader>

        {/* 預覽 */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm space-y-1.5">
            <p className="font-semibold text-gray-900 text-sm">{organization}</p>
            <p className="flex items-center gap-1.5 text-gray-500 text-xs">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              {activityDate} {time}
            </p>
            <p className="flex items-center gap-1.5 text-gray-500 text-xs">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
              {location}
            </p>
            {giftNames.length > 0 && (
              <p className="flex items-center gap-1.5 text-pink-600 text-xs">
                <Gift className="w-3.5 h-3.5 flex-shrink-0" />
                {giftNames.join("、")}
              </p>
            )}
            <p className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-blue-500 truncate">
                {shareUrl.replace("https://", "")}
              </span>
            </p>
          </div>
        </div>

        {/* 分享選項 */}
        <div className="p-4 bg-white space-y-3">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">選擇分享方式</p>

          <div className="grid grid-cols-3 gap-2">
            {/* LINE */}
            <button
              onClick={handleLine}
              className="flex flex-col items-center gap-2 py-3 rounded-xl bg-[#00B900]/10 hover:bg-[#00B900]/20 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#00B900]" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.07 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              <span className="text-xs font-medium text-[#00B900]">LINE</span>
            </button>

            {/* Threads */}
            <button
              onClick={handleThreads}
              className="flex flex-col items-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg viewBox="0 0 192 192" className="w-6 h-6 fill-gray-900" xmlns="http://www.w3.org/2000/svg">
                <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.23c8.249.054 14.474 2.452 18.502 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.452-15.153 9.898-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.07 0h-.113C68.882.195 47.292 9.643 32.788 28.08 19.882 44.485 13.224 67.315 13.001 96c.223 28.685 6.88 51.515 19.788 67.92 14.504 18.436 36.094 27.884 64.208 28.08h.113c24.96-.173 42.554-6.708 57.048-21.188 18.963-18.945 18.392-42.692 12.142-57.27-4.484-10.454-13.033-18.945-24.763-24.554Z"/>
              </svg>
              <span className="text-xs font-medium text-gray-900">Threads</span>
            </button>

            {/* IG */}
            <button
              onClick={handleIG}
              className="flex flex-col items-center gap-2 py-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-pink-500" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
              <span className="text-xs font-medium text-pink-500">IG</span>
            </button>
          </div>

          {/* 複製 */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm text-gray-600 font-medium"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-600">已複製！</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                複製文字
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
