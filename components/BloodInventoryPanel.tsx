"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { REGIONS } from "@/lib/regionConfig";

interface BloodInventoryCenter {
  name: string;
  bloodTypes: Record<string, string>;
}

interface BloodInventory {
  updatedAt: string;
  centers: BloodInventoryCenter[];
}

const STATUS_CONFIG = {
  urgent: { label: "急缺", fill: 18, color: "#ef4444", wave: "#dc2626" },
  low: { label: "偏低", fill: 50, color: "#f59e0b", wave: "#d97706" },
  normal: { label: "正常", fill: 82, color: "#10b981", wave: "#059669" },
  unknown: { label: "—", fill: 0, color: "#d1d5db", wave: "#9ca3af" },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

const BLOOD_TYPES = ["A", "B", "O", "AB"] as const;

function BloodDrop({
  type,
  status,
  delay = 0,
}: {
  type: string;
  status: StatusKey;
  delay?: number;
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const fillY = 100 - config.fill;
  const isUrgent = status === "urgent";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative ${isUrgent ? "animate-heartbeat" : ""}`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <svg width="44" height="58" viewBox="0 0 44 58" fill="none">
          <defs>
            <clipPath id={`drop-${type}-${delay}`}>
              <path d="M22 2C22 2 4 22 4 35C4 45.5 12.1 54 22 54C31.9 54 40 45.5 40 35C40 22 22 2 22 2Z" />
            </clipPath>
          </defs>
          {/* 背景 */}
          <path
            d="M22 2C22 2 4 22 4 35C4 45.5 12.1 54 22 54C31.9 54 40 45.5 40 35C40 22 22 2 22 2Z"
            fill="#f3f4f6"
            stroke="#e5e7eb"
            strokeWidth="1.5"
          />
          {/* 水位填充 */}
          <g clipPath={`url(#drop-${type}-${delay})`}>
            <rect
              x="0"
              y={fillY + "%"}
              width="100%"
              height={config.fill + "%"}
              fill={config.color}
              opacity="0.85"
            >
              <animate
                attributeName="y"
                values={`${fillY + 1.5}%;${fillY - 1.5}%;${fillY + 1.5}%`}
                dur="3s"
                repeatCount="indefinite"
              />
            </rect>
            {/* 波浪效果 */}
            <ellipse
              cx="22"
              cy={fillY + "%"}
              rx="26"
              ry="3"
              fill={config.wave}
              opacity="0.4"
            >
              <animate
                attributeName="cy"
                values={`${fillY + 1.5}%;${fillY - 1.5}%;${fillY + 1.5}%`}
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="rx"
                values="26;22;26"
                dur="3s"
                repeatCount="indefinite"
              />
            </ellipse>
          </g>
          {/* 高光 */}
          <ellipse cx="15" cy="24" rx="4" ry="6" fill="white" opacity="0.3" />
        </svg>
      </div>
      <span className="text-sm font-bold text-gray-700">{type}</span>
      <span
        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          status === "urgent"
            ? "bg-red-100 text-red-600"
            : status === "low"
            ? "bg-amber-100 text-amber-600"
            : status === "normal"
            ? "bg-emerald-100 text-emerald-600"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {config.label}
      </span>
    </div>
  );
}

export default function BloodInventoryPanel() {
  const [inventory, setInventory] = useState<BloodInventory | null>(null);
  const [activeCenter, setActiveCenter] = useState(0);

  useEffect(() => {
    fetch("/api/blood-inventory")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setInventory(json.data);
      })
      .catch(() => {});
  }, []);

  if (!inventory) return null;

  const urgentCount = inventory.centers.reduce(
    (sum, c) =>
      sum + Object.values(c.bloodTypes).filter((s) => s === "urgent").length,
    0
  );

  const center = inventory.centers[activeCenter];

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white overflow-hidden shadow-sm">
      {/* 頂部警示橫幅 */}
      {urgentCount > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-white/90 shrink-0 animate-heartbeat" />
          <p className="text-[11px] font-medium text-white/95">
            全台有{" "}
            <span className="font-extrabold text-white">{urgentCount}</span>{" "}
            項血型急缺，急需您的支援！
          </p>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* 中心切換 Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {inventory.centers.map((c, idx) => {
            const region = REGIONS.find((r) => r.centerFilter === c.name);
            const tabLabel = region?.displayName ?? c.name;
            const centerUrgent = Object.values(c.bloodTypes).filter(
              (s) => s === "urgent"
            ).length;
            return (
              <button
                key={c.name}
                onClick={() => setActiveCenter(idx)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all duration-200 relative ${
                  activeCenter === idx
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tabLabel}
                {centerUrgent > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* 血滴水位圖 */}
        <div className="flex justify-around items-end py-2">
          {BLOOD_TYPES.map((t, i) => (
            <BloodDrop
              key={`${center.name}-${t}`}
              type={t}
              status={(center.bloodTypes[t] as StatusKey) || "unknown"}
              delay={i * 80}
            />
          ))}
        </div>

        {/* 更新時間 + 圖例 */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
          <span>{inventory.updatedAt}</span>
          <div className="flex gap-2.5">
            {(["urgent", "low", "normal"] as const).map((s) => (
              <div key={s} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: STATUS_CONFIG[s].color }}
                />
                <span>{STATUS_CONFIG[s].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
