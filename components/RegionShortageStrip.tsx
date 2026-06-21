import Link from "@/components/Link";
import { Droplet, ArrowRight } from "lucide-react";
import inventoryData from "@/data/bloodInventory.json";

interface BloodInventory {
  updatedAt: string;
  centers: { name: string; bloodTypes: Record<string, string> }[];
}

const inventory = inventoryData as BloodInventory;
const BLOOD_TYPES = ["A", "B", "O", "AB"] as const;

const STATUS = {
  urgent: { label: "急缺", dot: "#ef4444", badge: "bg-red-100 text-red-700" },
  low: { label: "偏低", dot: "#f59e0b", badge: "bg-amber-100 text-amber-700" },
  normal: { label: "正常", dot: "#10b981", badge: "bg-emerald-100 text-emerald-700" },
  unknown: { label: "—", dot: "#d1d5db", badge: "bg-gray-100 text-gray-500" },
} as const;

type StatusKey = keyof typeof STATUS;

/**
 * 區域頁的即時血液庫存小條：顯示該區捐血中心 4 種血型狀態，
 * 內鏈到 /blood-shortage。同時為區域頁帶來每日新鮮內容（利於排名與 Discover）。
 */
export default function RegionShortageStrip({
  centerFilter,
  displayName,
}: {
  centerFilter: string;
  displayName: string;
}) {
  const center = inventory.centers.find((c) => c.name === centerFilter);
  if (!center) return null;

  const urgentCount = BLOOD_TYPES.filter(
    (t) => center.bloodTypes[t] === "urgent"
  ).length;
  const lowCount = BLOOD_TYPES.filter((t) => center.bloodTypes[t] === "low").length;
  const note =
    urgentCount > 0
      ? `${urgentCount} 種血型急缺，急需您挽袖`
      : lowCount > 0
      ? `${lowCount} 種血型偏低，歡迎就近補充`
      : "庫存大致穩定，感謝持續捐血";

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              urgentCount
                ? "bg-red-500 animate-pulse"
                : lowCount
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
          />
          <h2 className="text-sm font-bold text-gray-800">
            {displayName}血液庫存即時
          </h2>
        </div>
        <span className="text-[11px] text-gray-400">{inventory.updatedAt}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {BLOOD_TYPES.map((t) => {
          const s = (center.bloodTypes[t] as StatusKey) || "unknown";
          const cfg = STATUS[s] || STATUS.unknown;
          return (
            <div
              key={t}
              className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 py-2"
            >
              <span className="flex items-center gap-1 text-sm font-bold text-gray-700">
                <Droplet className="h-3.5 w-3.5" style={{ color: cfg.dot }} />
                {t}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500">{note}</p>
        <Link
          prefetch={false}
          href="/blood-shortage"
          className="flex shrink-0 items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          看全台血液庫存
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
