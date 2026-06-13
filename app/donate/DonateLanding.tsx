"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import Link from "@/components/Link";
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
  { num: "03", title: "捐血", desc: "全血 250–500cc，約 10 分鐘" },
  { num: "04", title: "休息領贈品", desc: "補充點心飲料，帶走紀念品" },
];

/* ─── Main Component ─────────────────────────────────────────────── */

export default function DonateLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const dropEntranceRef = useRef<HTMLDivElement>(null);
  const dropSvgRef = useRef<SVGSVGElement>(null);
  const statNumRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(() => {
    // ── Grab refs early so we can use in entrance + idle ─────────
    const dropEl = dropRef.current!;
    const dropSvg = dropSvgRef.current!;

    // ── Measure drop natural center before any animation ─────────
    // 落點要對齊 section 中心（rings/文字都是 top:50% 定位在 section），
    // 不能用 window.innerHeight/2 —— 手機版內容溢出時 section 會高於視窗，
    // 兩者基準不同會害血滴跑到圈圈上方。
    const sectionEl = dropEl.closest(".mega-section") as HTMLElement;
    const sectionRect = sectionEl.getBoundingClientRect();
    const sectionCenterY = sectionRect.top + sectionRect.height / 2;
    const dropRect = dropEl.getBoundingClientRect();
    const dropNaturalCenterY = dropRect.top + dropRect.height / 2;
    const yToCenter = sectionCenterY - dropNaturalCenterY;

    // ── Hero entrance: drop falls in, then text ───────────────────
    const splitTitle = new SplitText(heroTitleRef.current!, { type: "chars" });
    const splitSub = new SplitText(heroSubRef.current!, { type: "chars" });

    gsap.timeline({ delay: 0.2 })
      // drop pops in via inner wrapper — dropEl is reserved for scrub scale only
      .from(dropEntranceRef.current!, { scale: 0.55, duration: 0.6, ease: "power3.out" }, 0)
      // squash on landing
      .to(dropSvg, { scaleY: 0.76, scaleX: 1.24, duration: 0.06, ease: "power2.in" }, 0.57)
      .to(dropSvg, { scaleY: 1.08, scaleX: 0.93, duration: 0.08, ease: "power2.out" }, 0.62)
      .to(dropSvg, { scaleY: 1, scaleX: 1, duration: 0.38, ease: "elastic.out(1, 0.45)" }, 0.68)
      // text flies in right after
      .from(splitTitle.chars, {
        opacity: 0, y: 55, rotationX: -85,
        stagger: 0.04, duration: 0.65, ease: "back.out(1.8)",
        transformPerspective: 800,
      }, 0.35)
      .from(splitSub.chars, {
        opacity: 0, y: 18, stagger: 0.02, duration: 0.4, ease: "power2.out",
      }, "-=0.3")
      .from(".hero-cta-group", { opacity: 0, y: 22, duration: 0.4, ease: "power2.out" }, "-=0.1")
      .from(".hero-scroll-hint", { opacity: 0, duration: 0.5 }, "+=0.3");

    // ── Set initial states ───────────────────────────────────────
    gsap.set(".blood-bg", { opacity: 0 });
    gsap.set(".blood-label", { opacity: 0, xPercent: -50 });
    COMPONENTS.forEach((_, i) => {
      gsap.set(`.drop-ring-${i}`, { scale: 0, opacity: 0, xPercent: -50, yPercent: -50 });
      gsap.set(`.comp-text-${i}`, { opacity: 0, y: 24, xPercent: -50 });
    });

    // ── Idle: float + gentle squash (no rotation — avoids snap on scroll) ──
    // delays are long enough that entrance (~1.1s) finishes first
    const idleFloat = gsap.to(dropEl, {
      y: -11, duration: 2.3, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.6,
    });
    const idleSquash = gsap.to(dropSvg, {
      scaleX: 0.94, scaleY: 1.06, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.9,
    });
    const idleGlow = gsap.to(dropSvg, {
      filter: "drop-shadow(0 0 72px rgba(220,38,38,0.85)) drop-shadow(0 0 24px rgba(255,80,80,0.55))",
      duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.5,
    });

    // ── Mega timeline: one scrub controls everything ─────────────
    // just kill idle tweens — no gsap.set snap; scrub timeline takes over naturally
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".mega-section",
        start: "top top",
        end: "+=500%",
        pin: true,
        scrub: 1.5,
        onEnter: () => {
          idleFloat.kill();
          idleSquash.kill();
          idleGlow.kill();
          gsap.set(dropEl, { y: 0 });
          gsap.set(dropSvg, { scaleX: 1, scaleY: 1, clearProps: "filter" });
        },
      },
    });

    tl
      // 0–15%: hero text fades up
      .to(".hero-text-group", { opacity: 0, y: -30, duration: 0.15 }, 0)
      .to(".hero-scroll-hint", { opacity: 0, duration: 0.08 }, 0)

      // 0–32%: drop glides to center + shrinks linearly from first scroll pixel
      .to(dropEl, { y: yToCenter, scale: 0.6, duration: 0.32, ease: "none" }, 0)

      // 32–37%: squash-bounce as it "lands" at center
      .to(dropSvg, { scaleY: 0.78, scaleX: 1.22, duration: 0.03 }, 0.32)
      .to(dropSvg, { scaleY: 1, scaleX: 1, duration: 0.05, ease: "back.out(2.5)" }, 0.35)

      // 18–34%: backgrounds swap
      .to(".hero-bg", { opacity: 0, duration: 0.16 }, 0.18)
      .to(".blood-bg", { opacity: 1, duration: 0.14 }, 0.22)
      .to(".blood-label", { opacity: 1, duration: 0.10 }, 0.30)

      // 32–36%: highlights fade before first morph
      .to(".drop-highlights", { opacity: 0, duration: 0.08 }, 0.32)

      // 36–50%: pre-squash → morph → RBC oval, ring grows, text slides up
      .to(dropSvg, { scaleX: 1.22, scaleY: 0.80, duration: 0.03 }, 0.36)
      .to(dropSvg, { scaleX: 1, scaleY: 1, duration: 0.08, ease: "back.out(2.5)" }, 0.41)
      .to(".morph-path", { morphSVG: ".rbc-target", duration: 0.14 }, 0.36)
      .to(".morph-path", { attr: { fill: "#ef4444" }, duration: 0.06 }, 0.37)
      .to(".drop-ring-0", { scale: 1, opacity: 1, duration: 0.14 }, 0.36)
      .to(".comp-text-0", { opacity: 1, y: 0, duration: 0.14 }, 0.44)

      // 60–68%: RBC exits → pre-squash → morph to platelet spiky shape
      .to(".comp-text-0", { opacity: 0, y: -18, duration: 0.10 }, 0.60)
      .to(".drop-ring-0", { opacity: 0, scale: 0.85, duration: 0.10 }, 0.60)
      .to(dropSvg, { scaleX: 1.22, scaleY: 0.80, duration: 0.03 }, 0.60)
      .to(".morph-path", { morphSVG: ".platelet-target", duration: 0.12 }, 0.60)
      .to(".morph-path", { attr: { fill: "#f59e0b" }, duration: 0.06 }, 0.61)
      .to(dropSvg, { scaleX: 1, scaleY: 1, duration: 0.08, ease: "back.out(2.5)" }, 0.64)
      .to(".drop-ring-1", { scale: 1, opacity: 1, duration: 0.12 }, 0.64)
      .to(".comp-text-1", { opacity: 1, y: 0, duration: 0.14 }, 0.68)

      // 79–88%: platelet exits → pre-squash → morph to plasma wide oval
      .to(".comp-text-1", { opacity: 0, y: -18, duration: 0.10 }, 0.79)
      .to(".drop-ring-1", { opacity: 0, scale: 0.85, duration: 0.10 }, 0.79)
      .to(dropSvg, { scaleX: 1.22, scaleY: 0.80, duration: 0.03 }, 0.79)
      .to(".morph-path", { morphSVG: ".plasma-target", duration: 0.12 }, 0.79)
      .to(".morph-path", { attr: { fill: "#eab308" }, duration: 0.06 }, 0.80)
      .to(dropSvg, { scaleX: 1, scaleY: 1, duration: 0.08, ease: "back.out(2.5)" }, 0.83)
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
      ScrollTrigger.create({
        trigger: ctaEl,
        start: "top 72%",
        once: true,
        onEnter: () => {
          [".cta-ripple-1", ".cta-ripple-2"].forEach((sel, i) => {
            const el = ctaEl.querySelector(sel);
            if (!el) return;
            gsap.timeline({ repeat: -1, delay: i * 1.1 })
              .set(el, { scale: 1, opacity: 0.45 })
              .to(el, { scale: 3.4, opacity: 0, duration: 2.6, ease: "power2.out" });
          });
        },
      });
    }

    // ── Floating ambient particles ────────────────────────────
    const rng = (a: number, b: number) => a + Math.random() * (b - a);
    const particleContainer = containerRef.current!.querySelector(".hero-particles") as HTMLElement;
    const dots: HTMLElement[] = [];
    for (let i = 0; i < 22; i++) {
      const dot = document.createElement("span");
      const size = rng(2, 7);
      gsap.set(dot, {
        position: "absolute",
        display: "block",
        borderRadius: "50%",
        width: size,
        height: size,
        left: `${rng(5, 95)}%`,
        top: `${rng(10, 95)}%`,
        background: "#dc2626",
        opacity: 0,
        boxShadow: `0 0 ${size * 3}px rgba(220,38,38,0.55)`,
      });
      particleContainer.appendChild(dot);
      dots.push(dot);
      gsap.timeline({ repeat: -1, delay: rng(0, 9) })
        .to(dot, { opacity: rng(0.08, 0.28), duration: rng(1, 2.5), ease: "power1.in" })
        .to(dot, { y: -rng(100, 300), x: rng(-50, 50), opacity: 0, duration: rng(7, 15), ease: "none" }, "-=0.5")
        .set(dot, { y: 0, x: 0, left: `${rng(5, 95)}%` });
    }

    // ── EKG heartbeat line ────────────────────────────────────
    const ekgSvgEl = containerRef.current!.querySelector(".ekg-svg") as SVGSVGElement | null;
    const ekgPath = ekgSvgEl?.querySelector(".ekg-path") as SVGPathElement | null;
    if (ekgSvgEl && ekgPath) {
      const len = ekgPath.getTotalLength();
      gsap.set(ekgPath, { strokeDasharray: len, strokeDashoffset: len });
      ScrollTrigger.create({
        trigger: ekgSvgEl,
        start: "top 82%",
        once: true,
        onEnter: () => gsap.to(ekgPath, {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: "power2.inOut",
          onComplete: () => gsap.to(ekgPath, {
            strokeOpacity: 0.15, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: -1,
          }),
        }),
      });
    }

    return () => { dots.forEach(d => d.remove()); };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-[#0a0205] text-white overflow-x-hidden">

      {/* ── MEGA SECTION ─────────────────────────────────────────── */}
      <section className="mega-section relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Background layers */}
        <div className="hero-bg absolute inset-0 bg-gradient-to-br from-[#1c0008] via-[#3a0010] to-[#0a0205] pointer-events-none" aria-hidden />
        <div className="blood-bg absolute inset-0 bg-[#06000a] pointer-events-none" style={{ opacity: 0 }} aria-hidden />

        {/* Ambient floating particles */}
        <div className="hero-particles absolute inset-0 overflow-hidden pointer-events-none z-[6]" aria-hidden />

        {/* "血液的組成" label — absolute top center */}
        <p
          className="blood-label absolute top-8 left-1/2 text-white/20 text-[9px] tracking-[0.4em] uppercase font-medium whitespace-nowrap select-none z-20 pointer-events-none"
          style={{ opacity: 0 }}
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
              opacity: 0,
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
          {/* inner wrapper: entrance scale only — scrub scale is on the outer dropRef */}
          <div ref={dropEntranceRef}>
          <svg
            ref={dropSvgRef}
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
              {/* Platelet: irregular disc with 3 pseudopods (activated thrombocyte) */}
              <path className="platelet-target" d="M55 18 C65 10,88 18,98 34 C108 26,116 42,106 58 C116 66,112 82,96 88 C100 100,88 112,72 116 C66 126,52 130,40 122 C28 126,14 114,16 98 C4 92,6 74,20 66 C6 56,12 38,28 32 C30 20,44 14,55 18 Z" />
              {/* Plasma: wide horizontal oval — liquid has no fixed shape, wider than tall */}
              <path className="plasma-target" d="M5 85 C5 65,22 52,46 50 C52 46,60 46,68 50 C92 52,115 65,115 85 C115 105,98 118,74 118 C64 122,56 122,46 118 C22 118,5 105,5 85 Z" />
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
        </div>

        {/* Component text blocks — absolute centered below drop-at-center */}
        {COMPONENTS.map((c, i) => (
          <div
            key={i}
            className={`comp-text-${i} absolute left-1/2 text-center z-20 pointer-events-none`}
            style={{ top: "calc(50% + 108px)", width: "min(340px, 88vw)", opacity: 0 }}
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
          <p className="text-center text-white/32 mb-10 text-sm tracking-wide">每一袋血，都是真實的生命延續</p>
          <div className="flex justify-center mb-10">
            <svg className="ekg-svg overflow-visible" width="320" height="36" viewBox="0 0 320 36" fill="none" aria-hidden>
              <path
                className="ekg-path"
                d="M0 18 L78 18 L90 18 L97 3 L107 33 L117 3 L127 18 L320 18"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.45"
              />
            </svg>
          </div>
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
          <div className="relative inline-block">
            <div className="cta-ripple-1 absolute inset-0 rounded-2xl pointer-events-none border border-white/40" />
            <div className="cta-ripple-2 absolute inset-0 rounded-2xl pointer-events-none border border-white/25" />
            <Link
              href="/"
              className="relative inline-flex items-center gap-3 bg-white text-rose-700 font-black text-lg sm:text-xl px-10 py-5 rounded-2xl shadow-2xl hover:bg-rose-50 active:bg-rose-100 transition-colors"
            >
              <MapPin className="w-5 h-5 flex-shrink-0" />
              立刻找附近捐血點
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
