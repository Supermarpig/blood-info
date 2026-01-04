"use client";

import { useState } from "react";
import Confetti from "@/components/Confetti";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Plus,
  CheckCircle2,
  Film,
  Ticket,
  Store,
  Coffee,
  Package,
  UtensilsCrossed,
  MapPin,
  Lightbulb,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// 回報類型
type ReportMode = "location" | "wishlist";

// 與 SearchableDonationList 一致的標籤選項
const GIFT_TAGS = [
  { id: "電影票", label: "電影票", icon: Film },
  { id: "禮券", label: "禮券", icon: Ticket },
  { id: "超商", label: "超商", icon: Store },
  { id: "餐飲", label: "餐飲", icon: Coffee },
  { id: "生活用品", label: "生活用品", icon: Package },
  { id: "食品", label: "食品", icon: UtensilsCrossed },
];

const TIME_TAGS = ["早上", "下午", "整天"];

// 捐血地點回報的 Schema
const locationReportSchema = z.object({
  address: z.string().min(2, "地址至少需要 2 個字"),
  activityDate: z.string().min(1, "請選擇日期"),
  imgurUrl: z
    .string()
    .url("必須是有效的網址")
    .refine((url) => url.includes("i.imgur.com"), {
      message: "必須是 i.imgur.com 的圖片連結",
    }),
  tags: z.array(z.string()).default([]),
});

// 願望清單的 Schema
const wishlistSchema = z.object({
  title: z.string().min(2, "標題至少需要 2 個字"),
  description: z.string().min(10, "說明至少需要 10 個字"),
});

type LocationFormData = z.infer<typeof locationReportSchema>;
type WishlistFormData = z.infer<typeof wishlistSchema>;

export default function AddDonationEventModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ReportMode>("location");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);

  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(locationReportSchema),
    defaultValues: {
      address: "",
      activityDate: "",
      imgurUrl: "",
      tags: [],
    },
  });

  const wishlistForm = useForm<WishlistFormData>({
    resolver: zodResolver(wishlistSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const onLocationSubmit = async (data: LocationFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tags: selectedTags, type: "location" }),
      });

      if (response.ok) {
        handleSuccess();
        locationForm.reset();
        setSelectedTags([]);
      } else {
        const errorData = await response.json();
        console.error("Submission failed:", errorData);
      }
    } catch (error) {
      console.error("Error during submission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onWishlistSubmit = async (data: WishlistFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "wishlist" }),
      });

      if (response.ok) {
        handleSuccess();
        wishlistForm.reset();
      } else {
        const errorData = await response.json();
        console.error("Submission failed:", errorData);
      }
    } catch (error) {
      console.error("Error during submission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setConfettiKey((k) => k + 1);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setOpen(false);
    }, 5000);
  };

  const resetForms = () => {
    locationForm.reset();
    wishlistForm.reset();
    setSelectedTags([]);
    setIsSubmitted(false);
  };

  const handleModeChange = (newMode: ReportMode) => {
    setMode(newMode);
    resetForms();
  };

  return (
    <>
      <Confetti key={confettiKey} isActive={isSubmitted} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
          >
            <Plus className="h-4 w-4" />
            回報
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "location" ? "回報捐血地點" : "功能許願"}
            </DialogTitle>
            <DialogDescription>
              {mode === "location"
                ? "填寫地址、日期，選擇標籤，貼上圖片連結即可。"
                : "告訴我們您想要什麼新功能！"}
            </DialogDescription>
          </DialogHeader>

          {/* 模式切換按鈕 */}
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => handleModeChange("location")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === "location"
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <MapPin className="w-4 h-4" />
              回報地點
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("wishlist")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === "wishlist"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              功能許願
            </button>
          </div>

          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium text-green-600">
                {mode === "location"
                  ? "提交成功！感謝您的回報 ❤️"
                  : "許願成功！感謝您的建議 ✨"}
              </p>
            </div>
          ) : mode === "location" ? (
            /* 捐血地點回報表單 */
            <Form key="location-form" {...locationForm}>
              <form
                onSubmit={locationForm.handleSubmit(onLocationSubmit)}
                className="space-y-4"
              >
                {/* 地址 */}
                <FormField
                  control={locationForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>地址</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例如：新北市板橋區中山路一段152號"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 日期 */}
                <FormField
                  control={locationForm.control}
                  name="activityDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>日期</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isLoading}
                          onClick={(e) =>
                            (e.target as HTMLInputElement).showPicker?.()
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 時間標籤 */}
                <div>
                  <p className="text-sm font-medium mb-2">時間 (點選)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TIME_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                            isSelected
                              ? "bg-blue-500 text-white shadow-sm"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 贈品標籤 */}
                <div>
                  <p className="text-sm font-medium mb-2">贈品 (點選)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {GIFT_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      const IconComponent = tag.icon;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                            isSelected
                              ? "bg-pink-500 text-white shadow-sm"
                              : "bg-pink-50 text-pink-600 hover:bg-pink-100"
                          }`}
                        >
                          <IconComponent className="w-3 h-3" />
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 圖片連結 */}
                <FormField
                  control={locationForm.control}
                  name="imgurUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>圖片連結 (i.imgur.com)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://i.imgur.com/xxx.jpg"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    "提交回報"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            /* 願望清單表單 */
            <Form key="wishlist-form" {...wishlistForm}>
              <form
                onSubmit={wishlistForm.handleSubmit(onWishlistSubmit)}
                className="space-y-4"
              >
                {/* 功能標題 */}
                <FormField
                  control={wishlistForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>功能名稱</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例如：增加地圖顯示功能"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 功能說明 */}
                <FormField
                  control={wishlistForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>功能說明</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="請描述這個功能可以做什麼、為什麼需要它..."
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    "送出許願 ✨"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
