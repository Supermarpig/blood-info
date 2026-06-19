"use client";

/**
 * 「現場熱度」粒子層：火＝向上竄升的火星、水＝緩緩上浮的水泡。
 *
 * 絕對定位、pointer-events-none，疊在卡片上方但不擋互動。每顆粒子各有隨機的
 * 大小 / 顏色 / 速度，並以 repeatRefresh 讓每一輪重生的水平起點都不同 → 自然不重複。
 * 所有 tween 都在 useGSAP 同步建立，會被 context 自動回收；開「減少動態效果」時整層不動。
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { HEAT, type HeatTier } from "@/lib/onsiteHeat";

gsap.registerPlugin(useGSAP);

export default function HeatParticles({
  tier,
  count = 12,
  className = "",
}: {
  tier: HeatTier;
  count?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const p = HEAT[tier].particle;

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

      const ember = p.shape === "ember";
      const o = p.opacity;
      const parts = gsap.utils.toArray<HTMLElement>(".heat-particle", root);

      parts.forEach((el) => {
        const size = gsap.utils.random(p.size[0], p.size[1], 1);
        const color = gsap.utils.random(p.colors) as string;
        const dur = gsap.utils.random(p.dur[0], p.dur[1]);

        if (ember) {
          // 柴火火星：柔邊光點（radial-gradient + blur），定一個直欄為「家」，
          // 由火堆往上飄、左右搖曳、明滅閃爍、邊升邊縮，升到中上段就熄滅。
          gsap.set(el, {
            left: `${gsap.utils.random(0, 100)}%`,
            width: size,
            height: size,
            background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
            boxShadow: `0 0 ${(size * 1.6).toFixed(1)}px ${color}`,
            filter: "blur(0.6px)",
            opacity: 0,
          });

          const sway = gsap.utils.random(6, 12);
          const tl = gsap.timeline({
            repeat: -1,
            delay: gsap.utils.random(0, dur),
          });
          // 上飄：慢慢減速、邊升邊縮，升到容器中上段（5%～40% 高度）熄滅
          tl.fromTo(
            el,
            { y: () => (root.clientHeight || 200) + 8, scale: gsap.utils.random(0.7, 1.2) },
            {
              y: () => (root.clientHeight || 200) * gsap.utils.random(0.05, 0.4),
              scale: 0.25,
              duration: dur,
              ease: "sine.out",
            },
            0
          );
          // 左右搖曳（火星受熱氣擾動）
          tl.fromTo(
            el,
            { x: -sway },
            {
              x: sway,
              duration: dur / gsap.utils.random(2.4, 3.6),
              ease: "sine.inOut",
              yoyo: true,
              repeat: 5,
            },
            0
          );
          // 明滅閃爍（燃燒感，不是平順淡出）
          tl.to(
            el,
            {
              keyframes: { opacity: [0, o, o * 0.5, o * 0.9, o * 0.4, o * 0.75, o * 0.3, 0] },
              duration: dur,
              ease: "none",
            },
            0
          );
        } else {
          // 水泡：圓點緩緩上浮
          const drift = gsap.utils.random(-1, 1) * 28;
          gsap.set(el, {
            width: size,
            height: size,
            backgroundColor: color,
            boxShadow: `0 0 ${(size * 1.8).toFixed(1)}px ${color}`,
          });
          const tl = gsap.timeline({
            repeat: -1,
            repeatRefresh: true,
            delay: gsap.utils.random(0, dur),
          });
          tl.fromTo(
            el,
            { x: () => gsap.utils.random(0, root.clientWidth || 320), y: () => (root.clientHeight || 200) + 12 },
            { x: `+=${drift}`, y: -12, duration: dur, ease: "none" },
            0
          );
          tl.fromTo(el, { opacity: 0 }, { opacity: o, duration: dur * 0.25, ease: "sine.out" }, 0);
          tl.to(el, { opacity: 0, duration: dur * 0.3, ease: "sine.in" }, dur * 0.7);
        }
      });

      // 火堆本體：底部暖光帶，opacity（快）與 scaleY（慢）兩條不同週期的明滅互相打拍
      // → 看起來不規律，像在燃燒；scaleY 以底邊為原點往上竄，像火舌。
      const bed = root.querySelector<HTMLElement>(".heat-base");
      if (bed) {
        gsap.set(bed, { transformOrigin: "50% 100%" });
        gsap.fromTo(
          bed,
          { opacity: 0.5 },
          {
            opacity: 0.95,
            duration: () => gsap.utils.random(0.3, 0.7),
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            repeatRefresh: true,
          }
        );
        gsap.fromTo(
          bed,
          { scaleY: 0.9 },
          {
            scaleY: 1.12,
            duration: () => gsap.utils.random(0.6, 1.1),
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            repeatRefresh: true,
          }
        );
      }
    },
    { dependencies: [tier], scope: ref }
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {p.bed && (
        <div
          className="heat-base absolute inset-x-0 bottom-0 h-2/5 blur-sm"
          style={{ backgroundImage: p.bed }}
        />
      )}
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="heat-particle absolute left-0 top-0 rounded-full opacity-0 will-change-transform"
        />
      ))}
    </div>
  );
}
