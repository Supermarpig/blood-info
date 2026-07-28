"use client";

/**
 * 血型遺傳計算機：選父母血型 → 算出子女可能／不可能的血型。
 *
 * 為什麼做成工具而不是一張靜態遺傳表：使用者真正在搜尋的是「O 型和 A 型會生出什麼血型」
 * 「父母都是 A 型會不會生出 O 型」這種具體組合，工具能一次回答全部 16 種組合，
 * 且比表格更容易被分享。靜態表格版本仍保留在頁面下方，確保沒有 JS 也爬得到內容。
 *
 * 計算邏輯全部來自 lib/bloodTypeGenetics（純函式、server 端也用同一份）。
 */

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Check, X, ChevronRight, Info, RotateCcw } from "lucide-react";
import {
  ABO_PHENOTYPES,
  crossPhenotypes,
  crossRh,
  type AboPhenotype,
  type RhPhenotype,
} from "@/lib/bloodTypeGenetics";

gsap.registerPlugin(useGSAP);

const TYPE_DOT: Record<AboPhenotype, string> = {
  A: "#ef4444",
  B: "#3b82f6",
  O: "#10b981",
  AB: "#a855f7",
};

function TypeChip({
  type,
  tone,
}: {
  type: AboPhenotype;
  tone: "always" | "conditional" | "impossible";
}) {
  const styles = {
    always: "border-gray-300 bg-white text-gray-900",
    conditional: "border-dashed border-gray-300 bg-white text-gray-600",
    impossible: "border-gray-200 bg-gray-100 text-gray-400 line-through",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold ${styles}`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: tone === "impossible" ? "#d1d5db" : TYPE_DOT[type] }}
      />
      {type} 型
    </span>
  );
}

function Selector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AboPhenotype;
  onChange: (v: AboPhenotype) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-gray-500">{label}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {ABO_PHENOTYPES.map((t) => {
          const active = value === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              aria-pressed={active}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: active ? "#ffffff" : TYPE_DOT[t] }}
              />
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BloodTypeCalculator() {
  const [father, setFather] = useState<AboPhenotype>("O");
  const [mother, setMother] = useState<AboPhenotype>("A");
  const [fatherRh, setFatherRh] = useState<RhPhenotype>("+");
  const [motherRh, setMotherRh] = useState<RhPhenotype>("+");
  const [showDetail, setShowDetail] = useState(false);

  const result = useMemo(() => crossPhenotypes(father, mother), [father, mother]);
  const rh = useMemo(() => crossRh(fatherRh, motherRh), [fatherRh, motherRh]);

  const resultRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".bt-chip",
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out" }
      );
    },
    { scope: resultRef, dependencies: [father, mother] }
  );

  const possible = [...result.always, ...result.conditional];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* 輸入 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector label="父親血型" value={father} onChange={setFather} />
        <Selector label="母親血型" value={mother} onChange={setMother} />
      </div>

      {/* 結果 */}
      <div ref={resultRef} className="mt-5 rounded-xl bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-800">
          父 {father} 型 × 母 {mother} 型，子女可能是：
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {possible.map((t) => (
            <span key={t} className="bt-chip">
              <TypeChip
                type={t}
                tone={result.always.includes(t) ? "always" : "conditional"}
              />
            </span>
          ))}
        </div>

        {result.conditional.length > 0 && (
          <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-gray-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span>
              虛線框的{" "}
              <strong className="text-gray-700">
                {result.conditional.map((t) => `${t} 型`).join("、")}
              </strong>{" "}
              只有在父母帶特定隱性基因時才會出現，不是每一對都會生出來。
            </span>
          </p>
        )}

        {result.impossible.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <X className="h-3.5 w-3.5" />
              不可能出現的血型
            </p>
            <div className="flex flex-wrap gap-2">
              {result.impossible.map((t) => (
                <span key={t} className="bt-chip">
                  <TypeChip type={t} tone="impossible" />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 基因型細部機率 */}
        <button
          type="button"
          onClick={() => setShowDetail((s) => !s)}
          className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          {showDetail ? "收起" : "看各基因型組合的詳細機率"}
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${showDetail ? "rotate-90" : ""}`}
          />
        </button>

        {showDetail && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[380px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2 pr-3 font-semibold">父×母基因型</th>
                  {ABO_PHENOTYPES.map((t) => (
                    <th key={t} className="py-2 pr-3 font-semibold">
                      {t} 型
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.combinations.map((c) => (
                  <tr key={`${c.father}-${c.mother}`} className="border-b border-gray-100">
                    <td className="py-2 pr-3 font-medium text-gray-700">
                      {c.father} × {c.mother}
                    </td>
                    {ABO_PHENOTYPES.map((t) => (
                      <td
                        key={t}
                        className={`py-2 pr-3 ${
                          c.probabilities[t] > 0 ? "font-semibold text-gray-800" : "text-gray-300"
                        }`}
                      >
                        {c.probabilities[t]}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
              A 型的基因型可能是 AA 或 AO、B 型可能是 BB 或 BO，因此同樣是「A 型父親」，
              帶不帶隱性 O 基因會讓子女的可能血型不同。上表列出所有組合各自的機率。
            </p>
          </div>
        )}
      </div>

      {/* Rh 進階 */}
      <div className="mt-4 rounded-xl border border-gray-200 p-4">
        <p className="mb-3 text-xs font-semibold text-gray-500">
          進階：Rh 陰陽性（想知道會不會生出 Rh 陰性「熊貓血」再選）
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["父親 Rh", fatherRh, setFatherRh],
              ["母親 Rh", motherRh, setMotherRh],
            ] as const
          ).map(([label, val, set]) => (
            <div key={label}>
              <p className="mb-1.5 text-[11px] text-gray-400">{label}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["+", "-"] as RhPhenotype[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set(r)}
                    aria-pressed={val === r}
                    className={`rounded-lg border py-2 text-xs font-bold transition-colors ${
                      val === r
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Rh {r === "+" ? "陽性" : "陰性"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-gray-500">
          {rh.certain === "-" ? (
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
          ) : (
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
          )}
          <span>{rh.note}</span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setFather("O");
          setMother("A");
          setFatherRh("+");
          setMotherRh("+");
          setShowDetail(false);
        }}
        className="mt-4 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
      >
        <RotateCcw className="h-3 w-3" />
        重設
      </button>

      <p className="mt-4 border-t border-gray-200 pt-3 text-[11px] leading-relaxed text-gray-400">
        本計算依 ABO 與 Rh(D) 的標準孟德爾遺傳法則推算，適用於絕大多數情況。
        極少數特殊血型（如孟買型、順式 AB、嵌合體）可能出現例外，
        血型結果請以醫療院所實際檢驗為準，本工具不可作為親子關係的判定依據。
      </p>
    </div>
  );
}
