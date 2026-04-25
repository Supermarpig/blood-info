"use client";

import { useId, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Navigation2, ExternalLink } from "lucide-react";
import { NearbyLocation, UserLocation } from "@/hooks/useNearbyLocations";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#eef5ea] rounded-2xl" />,
});

/* ── SVG demo (shown before location is known) ── */
const VW = 380, VH = 240, CX = 190, CY = 122;
const PINS = [
  { x:  72, y:  58, cp: { x: 128, y:  58 }, lSide: "right", lx:  80, ly:  44, delay: "0s",    dur: "2.2s" },
  { x: 295, y:  48, cp: { x: 244, y:  52 }, lSide: "left",  lx: 207, ly:  35, delay: "0.55s", dur: "2.7s" },
  { x: 342, y: 150, cp: { x: 288, y:  85 }, lSide: "left",  lx: 254, ly: 137, delay: "1.1s",  dur: "2.5s" },
  { x: 250, y: 210, cp: { x: 282, y: 192 }, lSide: "left",  lx: 162, ly: 197, delay: "0.3s",  dur: "3.0s" },
  { x:  46, y: 186, cp: { x:  88, y: 176 }, lSide: "right", lx:  54, ly: 173, delay: "0.85s", dur: "2.6s" },
] as const;
const DEMO_DISTS = ["0.8km", "1.4km", "2.1km", "3.2km", "4.0km"];
const DEMO_NAMES = ["捐血點 1", "捐血點 2", "捐血點 3", "捐血點 4", "捐血點 5"];
const LW = 80, LH = 28;

function fmt(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

interface Props {
  nearbyLocations: NearbyLocation[];
  userLocation: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function NearbyMapSection({ nearbyLocations, userLocation, isLoading, error, onRetry }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "") || "nms";
  const hasResults = nearbyLocations.length > 0;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <section id="nearby-section" className="mb-6 scroll-mt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-[#171717]">離你最近的捐血點</h2>
          <p className="text-xs text-[#7a7a7a] mt-0.5">依目前位置排序</p>
        </div>
        {hasResults && (
          <button
            onClick={onRetry}
            className="text-xs font-semibold text-[#e11d2a] px-3 py-1.5 rounded-full border border-[#e11d2a]/30 bg-[#fff0f1]"
          >
            重新定位
          </button>
        )}
      </div>

      {/* ── Map area ── */}
      <div className="relative rounded-2xl border border-[#d9d9d5]" style={{ height: 380 }}>

        {/* Map content in its own clipped div */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
        {userLocation ? (
          /* Real Leaflet map — AnimatedLines rendered inside via createPortal */
          <LeafletMap user={userLocation} locations={nearbyLocations} selectedIndex={selectedIndex} />
        ) : (
          /* SVG demo animation before location is known */
          <div className="w-full h-full" style={{ background: "linear-gradient(180deg, #eef5ea 0%, #e3ede0 100%)" }}>
            <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-full"
              style={{ fontFamily: "'Noto Sans TC', system-ui, sans-serif" }}>
              <defs>
                <pattern id={`${uid}-gs`} width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                </pattern>
                <pattern id={`${uid}-gl`} width="150" height="150" patternUnits="userSpaceOnUse">
                  <path d="M 150 0 L 0 0 0 150" fill="none" stroke="rgba(0,0,0,0.055)" strokeWidth="1.5" />
                </pattern>
                <radialGradient id={`${uid}-cg`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width={VW} height={VH} fill={`url(#${uid}-gs)`} />
              <rect width={VW} height={VH} fill={`url(#${uid}-gl)`} />
              <ellipse cx={-20} cy={120} rx={320} ry={180} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="8" />
              <ellipse cx={400} cy={80} rx={280} ry={220} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="6" />
              {[44, 88, 132, 170].map((r, i) => (
                <circle key={r} cx={CX} cy={CY} r={r} fill="none"
                  stroke={i === 0 ? "rgba(225,29,42,0.20)" : "rgba(0,0,0,0.055)"}
                  strokeWidth={i === 0 ? 1.5 : 1} strokeDasharray="3 9" />
              ))}
              {PINS.map((pin, i) => {
                const pid = `${uid}-p${i}`;
                const d = `M ${CX} ${CY} Q ${pin.cp.x} ${pin.cp.y} ${pin.x} ${pin.y}`;
                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke="#e11d2a" strokeWidth="5" strokeOpacity="0.08" />
                    <path id={pid} d={d} fill="none" stroke="#e11d2a" strokeWidth="2"
                      strokeDasharray="6 10" strokeOpacity="0.45" strokeLinecap="round"
                      style={{ animation: "nearbyDashFlow 1.8s linear infinite", animationDelay: pin.delay }} />
                  </g>
                );
              })}
              {PINS.map((pin, i) => {
                const isLeft = pin.lSide === "left";
                return (
                  <g key={i}>
                    <circle cx={pin.x} cy={pin.y} r="8" fill="#e11d2a" opacity="0.15">
                      <animate attributeName="r" values="6;14;6" dur="2.4s" repeatCount="indefinite" begin={`${i * 0.45}s`} />
                      <animate attributeName="opacity" values="0.18;0;0.18" dur="2.4s" repeatCount="indefinite" begin={`${i * 0.45}s`} />
                    </circle>
                    <circle cx={pin.x} cy={pin.y} r="5" fill="#e11d2a" stroke="white" strokeWidth="2" />
                    <circle cx={pin.x} cy={pin.y} r="2" fill="white" />
                    <rect x={pin.lx} y={pin.ly} width={LW} height={LH} rx={7}
                      fill="white" fillOpacity="0.92" stroke="rgba(0,0,0,0.09)" strokeWidth="1" />
                    <line x1={isLeft ? pin.lx + LW : pin.lx} y1={pin.ly + LH / 2}
                      x2={isLeft ? pin.x - 6 : pin.x + 6} y2={pin.y}
                      stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                    <text x={pin.lx + LW / 2} y={pin.ly + 10} textAnchor="middle" fontSize="8" fontWeight="700" fill="#e11d2a">
                      {DEMO_DISTS[i]}
                    </text>
                    <text x={pin.lx + LW / 2} y={pin.ly + 21} textAnchor="middle" fontSize="9" fontWeight="600" fill="#171717">
                      {DEMO_NAMES[i]}
                    </text>
                  </g>
                );
              })}
              <circle cx={CX} cy={CY} r="28" fill={`url(#${uid}-cg)`} />
              <circle cx={CX} cy={CY} r="16" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                <animate attributeName="r" values="13;22;13" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={CX} cy={CY} r="8" fill="#3b82f6" stroke="white" strokeWidth="2" />
              <circle cx={CX} cy={CY} r="3" fill="white" />
              <text x={CX} y={CY + 22} textAnchor="middle" fontSize="10" fontWeight="700" fill="#3b82f6">你在這</text>
            </svg>

            {!isLoading && !error && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                <span className="flex items-center gap-1 text-[11px] text-[#7a7a7a] bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-[#ececea]">
                  <Navigation2 className="w-3 h-3" />
                  點擊上方「找附近捐血點」開啟定位
                </span>
              </div>
            )}
          </div>
        )}

        {/* loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/65 backdrop-blur-sm z-[500]">
            <div className="flex items-center gap-2 text-sm font-medium text-[#4a4a4a]">
              <Loader2 className="w-4 h-4 animate-spin text-[#e11d2a]" />
              定位中…
            </div>
          </div>
        )}
        </div>{/* end map clip div */}

        {/* Floating result cards — bottom of map */}
        {hasResults && (
          <div className="absolute bottom-2 left-2 right-2 z-[500] flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory scrollbar-none">
            {nearbyLocations.map((loc, i) => {
              const isSelected = selectedIndex === i;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedIndex(isSelected ? null : i)}
                  className={`snap-start flex-shrink-0 w-52 flex items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-xl p-3 border shadow-md transition-all cursor-pointer ${
                    isSelected ? "border-orange-400 shadow-orange-200" : "border-[#ececea] hover:shadow-lg"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: isSelected ? "#f97316" : "#e11d2a" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#171717] truncate">{loc.event.organization}</p>
                    <p className="text-[11px] text-[#7a7a7a] truncate mt-0.5">{loc.event.location}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-bold" style={{ color: isSelected ? "#f97316" : "#e11d2a" }}>{fmt(loc.distance)}</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3 text-[#7a7a7a] mt-0.5 ml-auto" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* error */}
      {error && (
        <div className="mt-2 px-4 py-2.5 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
          {error}
        </div>
      )}
    </section>
  );
}
