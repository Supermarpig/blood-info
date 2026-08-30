"use client";

import { useEffect, useRef, useState } from "react";
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
  LocateFixed,
  Lightbulb,
  ImagePlus,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
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
import {
  TAIWAN_CITIES,
  checkAddressDetail,
  composeAddress,
  splitCityFromAddress,
} from "@/lib/addressValidation";
// 只取型別：lib/knownLocations 會讀檔，import type 在編譯期就被抹掉，不會進 client bundle
import type { KnownLocation } from "@/lib/knownLocations";

type ReportMode = "location" | "wishlist";

const GIFT_TAGS = [
  { id: "電影票", label: "電影票", icon: Film },
  { id: "禮券", label: "禮券", icon: Ticket },
  { id: "超商", label: "超商", icon: Store },
  { id: "餐飲", label: "餐飲", icon: Coffee },
  { id: "生活用品", label: "生活用品", icon: Package },
  { id: "食品", label: "食品", icon: UtensilsCrossed },
];

const TIME_TAGS = ["早上", "下午", "整天"];

const locationReportSchema = z.object({
  // 地址拆成「縣市」＋「詳細地址」：原本單一自由欄位收到的回報大量只寫「台北」，
  // 標不到地圖也查不出實際地點。縣市用選的，剩下那段才由使用者打，並強制夠具體。
  city: z.string().min(1, "請選擇縣市"),
  addressDetail: z.string().superRefine((value, ctx) => {
    const issue = checkAddressDetail(value);
    if (issue) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue.message });
    }
  }),
  activityDate: z.string().min(1, "請選擇日期"),
  tags: z.array(z.string()).default([]),
  email: z.string().email("請輸入有效的 Email").or(z.literal("")).optional(),
});

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

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(locationReportSchema),
    defaultValues: {
      city: "",
      addressDetail: "",
      activityDate: "",
      tags: [],
      email: "",
    },
  });

  /** 台北時區的 yyyy-MM-dd（用當地中午換算，避開跨日與時區邊界） */
  const taipeiDate = (offsetDays: number) => {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Taipei",
    });
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString("en-CA");
  };

  // 讓使用者看到「實際會送出的地址」，選了縣市又自己再打一次也不會變成「新北市新北市…」
  const watchedCity = locationForm.watch("city");
  const watchedDetail = locationForm.watch("addressDetail");
  const addressPreview =
    watchedDetail.trim().length >= 2
      ? composeAddress(watchedCity, watchedDetail)
      : "";

  /**
   * 地點快選：打兩個字就從「我們資料裡真的辦過捐血的地址」挑一個。
   * 原本使用者打兩個字就送出（「台北」），現在同樣兩個字，換來的是精確地址。
   */
  const [suggestions, setSuggestions] = useState<KnownLocation[]>([]);
  const [nearby, setNearby] = useState<
    (KnownLocation & { distanceM?: number })[]
  >([]);
  const [pickedAddress, setPickedAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  useEffect(() => {
    const query = watchedDetail.trim();
    // 已經從清單點過的就別再跳建議，否則選完清單還賴著不走
    if (!watchedCity || query.length < 1 || addressPreview === pickedAddress) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/known-locations?city=${encodeURIComponent(
            watchedCity
          )}&q=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data.locations) ? data.locations : []);
      } catch {
        /* 建議清單只是加分項，失敗就當作沒有 */
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [watchedCity, watchedDetail, addressPreview, pickedAddress]);

  /** 點選一筆已知地址：拆成縣市 + 詳細地址填回兩個欄位 */
  const applyAddress = (address: string, keepNearby = false) => {
    const parts = splitCityFromAddress(address);
    locationForm.setValue("city", parts.city || watchedCity, {
      shouldValidate: true,
    });
    locationForm.setValue("addressDetail", parts.detail || address, {
      shouldValidate: true,
    });
    setPickedAddress(address);
    setSuggestions([]);
    // 定位帶入時要留著附近清單：GPS 只到門牌，點附近的已知場地才是最精確的答案
    if (!keepNearby) setNearby([]);
    setLocateError(null);
  };

  /**
   * 用目前位置：一次做兩件事——把座標換成地址填進欄位，
   * 同時列出附近已知的捐血地點（在既有場地回報時，點清單比用 GPS 地址更精確）。
   */
  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocateError("這支瀏覽器不支援定位，請手動填寫");
      return;
    }
    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const [geoRes, nearRes] = await Promise.all([
            fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`),
            fetch(
              `/api/known-locations?lat=${latitude}&lng=${longitude}&limit=4`
            ),
          ]);

          const nearData = await nearRes.json().catch(() => ({}));
          setNearby(Array.isArray(nearData.locations) ? nearData.locations : []);

          const geoData = await geoRes.json().catch(() => ({}));
          if (geoRes.ok && geoData.formatted) {
            applyAddress(geoData.formatted, true);
          } else {
            setLocateError(geoData.error || "找不到這個位置的地址，請手動填寫");
          }
        } catch {
          setLocateError("定位查詢失敗，請手動填寫");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        setLocateError(
          error.code === error.PERMISSION_DENIED
            ? "沒有取得定位權限，請手動填寫地址"
            : "定位失敗，請手動填寫地址"
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const wishlistForm = useForm<WishlistFormData>({
    resolver: zodResolver(wishlistSchema),
    defaultValues: { title: "", description: "" },
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadError(null);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onLocationSubmit = async (data: LocationFormData) => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      let imgUrl: string | undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload-image-public", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setUploadError(uploadData.error || "圖片上傳失敗，請重試");
          setIsLoading(false);
          return;
        }
        imgUrl = uploadData.url;
      }

      const { city, addressDetail, ...rest } = data;
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          address: composeAddress(city, addressDetail),
          tags: selectedTags,
          type: "location",
          imgurUrl: imgUrl,
        }),
      });

      if (response.ok) {
        handleSuccess();
        locationForm.reset();
        setSelectedTags([]);
        clearImage();
      } else {
        const errorData = await response.json();
        console.error("Submission failed:", errorData);
        setSubmitError(errorData.error || "提交失敗，請稍後再試");
      }
    } catch (error) {
      console.error("Error during submission:", error);
      setSubmitError("提交失敗，請檢查網路後再試一次");
    } finally {
      setIsLoading(false);
    }
  };

  const onWishlistSubmit = async (data: WishlistFormData) => {
    setIsLoading(true);
    setSubmitError(null);
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
        setSubmitError(errorData.error || "提交失敗，請稍後再試");
      }
    } catch (error) {
      console.error("Error during submission:", error);
      setSubmitError("提交失敗，請檢查網路後再試一次");
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
    setSubmitError(null);
    clearImage();
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
                ? "填寫完整地址與日期，選擇標籤，可附上圖片。"
                : "告訴我們您想要什麼新功能！"}
            </DialogDescription>
          </DialogHeader>

          {/* 模式切換 */}
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
            <Form key="location-form" {...locationForm}>
              <form
                onSubmit={locationForm.handleSubmit(onLocationSubmit)}
                className="space-y-4"
              >
                {/* 地址：縣市用選的，詳細地址強制寫到區＋路名或地標 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">地址</p>
                    <span className="text-xs text-gray-400">
                      要能在地圖上找得到
                    </span>
                  </div>

                  {/* 人多半就站在捐血車旁邊：定位一次，兩個欄位都填好 */}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLoading || locating}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-60"
                  >
                    {locating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        定位中...
                      </>
                    ) : (
                      <>
                        <LocateFixed className="h-4 w-4 text-gray-500" />
                        用我現在的位置填入
                      </>
                    )}
                  </button>

                  {locateError && (
                    <p className="text-xs text-amber-600">{locateError}</p>
                  )}

                  <div className="flex gap-2">
                    <FormField
                      control={locationForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem className="w-[7rem] shrink-0 space-y-1">
                          <FormControl>
                            <select
                              {...field}
                              aria-label="縣市"
                              disabled={isLoading}
                              className={`flex h-11 w-full rounded-md border border-input bg-transparent px-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                                field.value ? "" : "text-muted-foreground"
                              }`}
                            >
                              <option value="">縣市</option>
                              {TAIWAN_CITIES.map((city) => (
                                <option key={city} value={city}>
                                  {city}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={locationForm.control}
                      name="addressDetail"
                      render={({ field }) => (
                        <FormItem className="flex-1 space-y-1">
                          <FormControl>
                            <Input
                              // h-11 / text-base：長輩點得到，且 16px 以上 iOS 才不會一聚焦就放大整頁
                              className="h-11 text-base"
                              placeholder="板橋區中山路一段152號"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 附近的已知捐血點：GPS 只會給門牌，點這裡才是我們資料裡的精確場地 */}
                  {nearby.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">你附近辦過捐血的地點：</p>
                      <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
                        {nearby.map((item) => (
                          <button
                            key={item.address}
                            type="button"
                            onClick={() => applyAddress(item.address)}
                            className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="flex-1">{item.address}</span>
                            {typeof item.distanceM === "number" && (
                              <span className="shrink-0 text-xs text-gray-400">
                                {item.distanceM < 1000
                                  ? `${item.distanceM} 公尺`
                                  : `${(item.distanceM / 1000).toFixed(1)} 公里`}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 打字時的快選：兩個字就能點到正確地址 */}
                  {suggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        以前在這裡辦過捐血，點一下直接帶入：
                      </p>
                      <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
                        {suggestions.map((item) => (
                          <button
                            key={item.address}
                            type="button"
                            onClick={() => applyAddress(item.address)}
                            className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span>{item.address}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {addressPreview ? (
                    <p className="flex items-start gap-1.5 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />
                      <span>將送出：{addressPreview}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      只寫「台北」我們找不到地點。請寫到區＋路名門牌，或寫得出招牌的地標，例如「板橋國小」。
                    </p>
                  )}
                </div>

                {/* 日期 */}
                <FormField
                  control={locationForm.control}
                  name="activityDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>日期</FormLabel>
                      {/* 九成的回報都是今天或明天的活動，先給兩顆按鈕省掉翻月曆 */}
                      <div className="mb-1.5 flex gap-1.5">
                        {[
                          { label: "今天", offset: 0 },
                          { label: "明天", offset: 1 },
                        ].map(({ label, offset }) => {
                          const value = taipeiDate(offset);
                          const isSelected = field.value === value;
                          return (
                            <button
                              key={label}
                              type="button"
                              disabled={isLoading}
                              onClick={() => field.onChange(value)}
                              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                isSelected
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              disabled={isLoading}
                              className={`h-11 w-full pl-3 text-left text-base font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(new Date(field.value), "yyyy年M月d日", {
                                  locale: zhTW,
                                })
                              ) : (
                                <span>選擇日期</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-highest" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date
                                  ? date.toLocaleDateString("en-CA", {
                                      timeZone: "Asia/Taipei",
                                    })
                                  : ""
                              )
                            }
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            locale={zhTW}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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

                {/* 圖片上傳 */}
                <div>
                  <p className="text-sm font-medium mb-2">
                    圖片{" "}
                    <span className="text-gray-400 font-normal">(選填)</span>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={isLoading}
                  />

                  {imagePreview ? (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="預覽"
                        className="w-full max-h-48 object-cover"
                      />
                      {isLoading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={clearImage}
                        disabled={isLoading}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-sm">點擊上傳圖片（最大 5MB）</span>
                    </button>
                  )}

                  {uploadError && (
                    <p className="text-sm text-red-500 mt-1">{uploadError}</p>
                  )}
                </div>

                {/* Email */}
                <FormField
                  control={locationForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email{" "}
                        <span className="text-gray-400 font-normal">(選填，上線時通知你)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="example@gmail.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {submitError && (
                  <p className="text-sm text-red-500">{submitError}</p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {imageFile ? "上傳圖片中..." : "提交中..."}
                    </>
                  ) : (
                    "提交回報"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form key="wishlist-form" {...wishlistForm}>
              <form
                onSubmit={wishlistForm.handleSubmit(onWishlistSubmit)}
                className="space-y-4"
              >
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

                {submitError && (
                  <p className="text-sm text-red-500">{submitError}</p>
                )}

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
