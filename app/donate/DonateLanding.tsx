"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import Link from "next/link";
import { MapPin, ChevronDown } from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, MorphSVGPlugin);

/* ─── Data ──────────────────────────────────────────────────────── */

const COMPONENTS = [
  {
    name: "紅血球",
    english: "Red Blood Cells",
    role: "攜帶氧氣，維持生命",
    detail:
      "每滴血含約 500 萬個紅血球，負責將肺部氧氣運送到全身細胞。外傷、手術大量失血時，紅血球輸注是最關鍵的救命手段。",
    color: "#ef4444",
    ringBg: "rgba(239,68,68,0.12)",
    ringBorder: "rgba(239,68,68,0.38)",
  },
  {
    name: "血小板",
    english: "Platelets",
    role: "止血癒合的關鍵衛兵",
    detail:
      "血管破損時，血小板在數秒內聚集封堵傷口。化療與血液疾病患者每天都需要血小板補充——有效期僅 5 天。",
    color: "#f59e0b",
    ringBg: "rgba(245,158,11,0.12)",
    ringBorder: "rgba(245,158,11,0.38)",
  },
  {
    name: "血漿",
    english: "Plasma",
    role: "維持循環、輸送養分",
    detail:
      "佔血液 55% 的淡黃色液體，攜帶蛋白質、荷爾蒙與抗體。是重度燒傷、凝血異常患者不可或缺的治療材料。",
    color: "#eab308",
    ringBg: "rgba(234,179,8,0.12)",
    ringBorder: "rgba(234,179,8,0.38)",
  },
];

const STATS = [
  { number: 3, unit: "條命", prefix: "最多能救", desc: "一次全血捐獻" },
  { number: 700, unit: "袋", prefix: "每天需要超過", desc: "台灣全台血液需求" },
  { number: 15, unit: "分鐘", prefix: "全程只需", desc: "完成捐血的時間" },
];

const STEPS = [
  { num: "01", title: "填寫問卷", desc: "確認健康狀況，約 3 分鐘" },
  { num: "02", title: "健康篩檢", desc: "血壓、血型、血色素快速測試" },
  { num: "03", title: "捐血", desc: "全血 250–450cc，約 10 分鐘" },
  { num: "04", title: "休息領贈品", desc: "補充點心飲料，帶走紀念品" },
];

/* ─── Main Component ─────────────────────────────────────────────── */

export default function DonateLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const statNumRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(() => {
    // ── Hero entrance: SplitText ─────────────────────────────────
    const splitTitle = new SplitText(heroTitleRef.current!, { type: "chars" });
    const splitSub = new SplitText(heroSubRef.current!, { type: "chars" });

    gsap.timeline({ delay: 0.35 })
      .from(splitTitle.chars, {
        opacity: 0, y: 55, rotationX: -85,
        stagger: 0.04, duration: 0.65, ease: "back.out(1.8)",
        transformPerspective: 800,
      })
      .from(splitSub.chars, {
        opacity: 0, y: 18, stagger: 0.02, duration: 0.4, ease: "power2.out",
      }, "-=0.3")
      .from(".hero-cta-group", { opacity: 0, y: 22, duration: 0.4, ease: "power2.out" }, "-=0.1")
      .from(".hero-scroll-hint", { opacity: 0, duration: 0.5 }, "+=0.3");

    // ── Measure drop natural center before any animation ─────────
    const dropEl = dropRef.current!;
    const dropRect = dropEl.getBoundingClientRect();
    const dropNaturalCenterY = dropRect.top + dropRect.height / 2;
    const yToCenter = window.innerHeight / 2 - dropNaturalCenterY;

    // ── Set initial states ───────────────────────────────────────
    gsap.set(".blood-bg", { opacity: 0 });
    gsap.set(".blood-label", { opacity: 0, xPercent: -50 });
    COMPONENTS.forEach((_, i) => {
      gsap.set(`.drop-ring-${i}`, { scale: 0, opacity: 0, xPercent: -50, yPercent: -50 });
      gsap.set(`.comp-text-${i}`, { opacity: 0, y: 24, xPercent: -50 });
    });

    // ── Mega timeline: one scrub controls everything ─────────────
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".mega-section",
        start: "top top",
        end: "+=500%",
        pin: true,
        scrub: 1.5,
      },
    });

    tl
      // 0–15%: hero text fades up
      .to(".hero-text-group", { opacity: 0, y: -30, duration: 0.15 }, 0)
      .to(".hero-scroll-hint", { opacity: 0, duration: 0.08 }, 0)

      // 8–32%: drop glides to center, shrinks
      .to(dropEl, { y: yToCenter, scale: 0.6, duration: 0.24, ease: "power1.inOut" }, 0.08)

      // 18–34%: backgrounds swap
      .to(".hero-bg", { opacity: 0, duration: 0.16 }, 0.18)
      .to(".blood-bg", { opacity: 1, duration: 0.14 }, 0.22)
      .to(".blood-label", { opacity: 1, duration: 0.10 }, 0.30)

      // 32–36%: highlights fade before first morph
      .to(".drop-highlights", { opacity: 0, duration: 0.08 }, 0.32)

      // 36–50%: morph → RBC oval, ring grows, text slides up
      .to(".morph-path", { morphSVG: ".rbc-target", duration: 0.14 }, 0.36)
      .to(".morph-path", { attr: { fill: "#ef4444" }, duration: 0.06 }, 0.37)
      .to(".drop-ring-0", { scale: 1, opacity: 1, duration: 0.14 }, 0.36)
      .to(".comp-text-0", { opacity: 1, y: 0, duration: 0.14 }, 0.44)

      // 60–68%: RBC exits → morph to platelet spiky shape
      .to(".comp-text-0", { opacity: 0, y: -18, duration: 0.10 }, 0.60)
      .to(".drop-ring-0", { opacity: 0, scale: 0.85, duration: 0.10 }, 0.60)
      .to(".morph-path", { morphSVG: ".platelet-target", duration: 0.12 }, 0.60)
      .to(".morph-path", { attr: { fill: "#f59e0b" }, duration: 0.06 }, 0.61)
      .to(".drop-ring-1", { scale: 1, opacity: 1, duration: 0.12 }, 0.64)
      .to(".comp-text-1", { opacity: 1, y: 0, duration: 0.14 }, 0.68)

      // 79–88%: platelet exits → morph to plasma wide oval
      .to(".comp-text-1", { opacity: 0, y: -18, duration: 0.10 }, 0.79)
      .to(".drop-ring-1", { opacity: 0, scale: 0.85, duration: 0.10 }, 0.79)
      .to(".morph-path", { morphSVG: ".plasma-target", duration: 0.12 }, 0.79)
      .to(".morph-path", { attr: { fill: "#eab308" }, duration: 0.06 }, 0.80)
      .to(".drop-ring-2", { scale: 1, opacity: 1, duration: 0.12 }, 0.83)
      .to(".comp-text-2", { opacity: 1, y: 0, duration: 0.14 }, 0.87);

    // ── Stats counters ───────────────────────────────────────────
    STATS.forEach((stat, i) => {
      const el = statNumRefs.current[i];
      if (!el) return;
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el.closest(".stat-card") as Element,
        start: "top 82%",
        once: true,
        onEnter: () => gsap.to(obj, {
          val: stat.number, duration: 2.2, ease: "power2.out",
          onUpdate: () => { el.textContent = String(Math.round(obj.val)); },
        }),
      });
    });

    const statCards = gsap.utils.toArray<HTMLElement>(".stat-card", containerRef.current!);
    if (statCards.length) {
      gsap.from(statCards, {
        opacity: 0, y: 55, scale: 0.92, stagger: 0.14, duration: 0.6, ease: "back.out(1.5)",
        scrollTrigger: { trigger: statCards[0], start: "top 88%", once: true },
      });
    }

    const stepCards = gsap.utils.toArray<HTMLElement>(".step-card", containerRef.current!);
    if (stepCards.length) {
      gsap.from(stepCards, {
        opacity: 0, x: -48, stagger: 0.1, duration: 0.5, ease: "power2.out",
        scrollTrigger: { trigger: stepCards[0], start: "top 88%", once: true },
      });
    }

    const ctaEl = containerRef.current!.querySelector(".cta-content");
    if (ctaEl) {
      gsap.from(ctaEl, {
        opacity: 0, y: 55, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: ctaEl as Element, start: "top 78%", once: true },
      });
    }
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-[#0a0205] text-white overflow-x-hidden">

      {/* ── MEGA SECTION ─────────────────────────────────────────── */}
      <section className="mega-section relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Background layers */}
        <div className="hero-bg absolute inset-0 bg-gradient-to-br from-[#1c0008] via-[#3a0010] to-[#0a0205] pointer-events-none" aria-hidden />
        <div className="blood-bg absolute inset-0 bg-[#06000a] pointer-events-none" aria-hidden />

        {/* "血液的組成" label — absolute top center */}
        <p
          className="blood-label absolute top-8 left-1/2 text-white/20 text-[9px] tracking-[0.4em] uppercase font-medium whitespace-nowrap select-none z-20 pointer-events-none"
          aria-hidden
        />

        {/* Component rings — centered at viewport center, behind drop */}
        {COMPONENTS.map((c, i) => (
          <div
            key={i}
            className={`drop-ring-${i} absolute left-1/2 top-1/2 rounded-full pointer-events-none z-10`}
            style={{
              width: 168,
              height: 168,
              background: c.ringBg,
              border: `2px solid ${c.ringBorder}`,
              boxShadow: `0 0 60px ${c.ringBg}`,
            }}
            aria-hidden
          />
        ))}

        {/* PERSISTENT BLOOD DROP — part of flex flow, GSAP moves it to center */}
        <div
          ref={dropRef}
          className="relative z-20 mb-8 flex-shrink-0"
          style={{ willChange: "transform" }}
        >
          <svg
            viewBox="0 0 120 150"
            className="w-32 h-40 sm:w-40 sm:h-52"
            style={{ filter: "drop-shadow(0 0 48px rgba(220,38,38,0.45))" }}
            aria-hidden
          >
            <defs>
              <radialGradient id="dropGrad" cx="33%" cy="22%" r="76%">
                <stop offset="0%" stopColor="#ff7575" />
                <stop offset="55%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </radialGradient>
              {/* MorphSVG target shapes — in defs so they are not rendered */}
              {/* RBC: flat biconcave disc (wide oval) */}
              <path className="rbc-target" d="M10 75 C10 50,32 30,60 30 C88 30,110 50,110 75 C110 100,88 120,60 120 C32 120,10 100,10 75 Z" />
              {/* Platelet: spiky irregular blob */}
              <path className="platelet-target" d="M50 15 C66 10,90 18,98 34 C108 28,116 44,108 56 C120 62,118 80,104 84 C110 98,100 112,86 108 C84 122,68 128,56 120 C48 130,32 124,30 110 C16 114,6 100,14 86 C2 80,2 62,16 56 C8 44,14 28,28 28 C22 14,38 8,50 15 Z" />
              {/* Plasma: wide teardrop / rounded oval */}
              <path className="plasma-target" d="M8 72 C8 36,30 8,60 8 C90 8,112 36,112 72 C112 108,90 138,60 138 C30 138,8 108,8 72 Z" />
            </defs>
            {/* Main morphable path — starts as blood drop */}
            <path
              className="morph-path"
              d="M60 10 C60 10,18 58,18 88 A42 42 0 1 0 102 88 C102 58,60 10,60 10 Z"
              fill="url(#dropGrad)"
            />
            {/* Highlights fade out when morphing */}
            <g className="drop-highlights">
              <ellipse cx="42" cy="65" rx="11" ry="19" fill="rgba(255,255,255,0.18)" transform="rotate(-22,42,65)" />
              <ellipse cx="52" cy="46" rx="5" ry="8" fill="rgba(255,255,255,0.1)" />
            </g>
          </svg>
        </div>

        {/* Component text blocks — absolute centered below drop-at-center */}
        {COMPONENTS.map((c, i) => (
          <div
            key={i}
            className={`comp-text-${i} absolute left-1/2 text-center z-20 pointer-events-none`}
            style={{ top: "calc(50% + 108px)", width: "min(340px, 88vw)" }}
            aria-hidden
          >
            <p className="text-white/28 text-[10px] font-semibold tracking-[0.28em] uppercase mb-2">
              {c.english}
            </p>
            <h2 className="text-5xl sm:text-6xl font-black mb-3 leading-none" style={{ color: c.color }}>
              {c.name}
            </h2>
            <p className="text-white/70 text-lg font-semibold mb-3">{c.role}</p>
            <p className="text-white/38 text-sm leading-relaxed">{c.detail}</p>
          </div>
        ))}

        {/* Hero text group — fades up on scroll */}
        <div className="hero-text-group relative z-20 text-center px-6 max-w-lg mx-auto">
          <p className="text-rose-400/60 text-[10px] font-semibold tracking-[0.32em] uppercase mb-5">
            Taiwan Blood Donation
          </p>
          <h1
            ref={heroTitleRef}
            className="text-5xl sm:text-7xl font-black text-white leading-tight mb-5"
            style={{ perspective: "800px" }}
          >
            你的血<br />能救一條命
          </h1>
          <p ref={heroSubRef} className="text-rose-200/65 text-lg sm:text-xl mb-10 font-medium">
            250cc，15 分鐘，一個決定
          </p>
          <div className="hero-cta-group flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold px-8 py-4 rounded-2xl text-base sm:text-lg transition-colors shadow-xl shadow-rose-900/60"
            >
              <MapPin className="w-5 h-5 flex-shrink-0" />
              找附近捐血點
            </Link>
            <Link
              href="/eligibility"
              className="flex items-center gap-2 border border-white/20 hover:border-white/45 text-white/70 hover:text-white px-8 py-4 rounded-2xl text-base transition-colors"
            >
              我可以捐血嗎？
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="hero-scroll-hint absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/28 select-none z-20">
          <span className="text-[9px] tracking-[0.35em] uppercase font-medium">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-gradient-to-b from-[#06000a] to-[#0a0205]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-3xl sm:text-4xl font-black text-white mb-3">捐血的影響力</h2>
          <p className="text-center text-white/32 mb-16 text-sm tracking-wide">每一袋血，都是真實的生命延續</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-6">
            {STATS.map((s, i) => (
              <div key={i} className="stat-card text-center">
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3 font-medium">{s.desc}</p>
                <div className="flex items-baseline justify-center gap-0.5 mb-1">
                  <span className="text-white/40 text-sm mr-1.5">{s.prefix}</span>
                  <span
                    ref={el => { statNumRefs.current[i] = el; }}
                    className="text-6xl sm:text-7xl font-black tabular-nums"
                    style={{ color: "#f87171" }}
                  >
                    0
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-rose-400/65 ml-1.5">{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ───────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#0a0205]">
        <div className="max-w-lg mx-auto">
          <h2 className="text-center text-3xl sm:text-4xl font-black text-white mb-3">捐血流程</h2>
          <p className="text-center text-white/32 mb-14 text-sm tracking-wide">簡單、安全、快速</p>
          <div className="space-y-3">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="step-card flex items-center gap-5 bg-white/[0.04] hover:bg-white/[0.07] rounded-2xl px-6 py-5 border border-white/[0.07] transition-colors"
              >
                <span className="text-3xl font-black font-mono flex-shrink-0 w-10 text-rose-700/55">{s.num}</span>
                <div>
                  <p className="text-white font-bold text-base">{s.title}</p>
                  <p className="text-white/35 text-sm mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-950 via-[#280008] to-[#0a0205]">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-72 rounded-full bg-rose-700/12 blur-[110px]" />
        </div>
        <div className="cta-content relative z-10 text-center px-6 max-w-xl mx-auto">
          <p className="text-rose-400/55 text-[10px] tracking-[0.35em] uppercase font-medium mb-4">你準備好了嗎</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            全台每天都有<br />人需要你的血
          </h2>
          <p className="text-rose-200/45 text-base mb-10 leading-relaxed">
            走進附近的捐血點，15 分鐘換來別人的第二次機會
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-3 bg-white text-rose-700 font-black text-lg sm:text-xl px-10 py-5 rounded-2xl shadow-2xl hover:bg-rose-50 active:bg-rose-100 transition-colors"
          >
            <MapPin className="w-5 h-5 flex-shrink-0" />
            立刻找附近捐血點
          </Link>
        </div>
      </section>

    </div>
  );
}
