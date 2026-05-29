"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RotateCcw, MapPin, Clock } from "lucide-react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import confetti from "canvas-confetti";

/* ─── Data ──────────────────────────────────────────────────── */

interface Question {
  id: string;
  label: string;
  question: string;
  hint: string;
  passLabel: string;
  failLabel: string;
  failMsg: string;
  waitTime: string | null;
}

const QUESTIONS: Question[] = [
  {
    id: "age",
    label: "年齡",
    question: "你幾歲了？",
    hint: "台灣規定：捐血年齡 17–65 歲",
    passLabel: "17 到 65 歲",
    failLabel: "未滿 17 或超過 65 歲",
    failMsg: "台灣規定捐血年齡為 17–65 歲之間。年齡到了隨時歡迎回來！",
    waitTime: null,
  },
  {
    id: "weight",
    label: "體重",
    question: "體重有 50 公斤以上嗎？",
    hint: "男女均需達 50 公斤，以確保捐血過程安全",
    passLabel: "有，50 kg 以上",
    failLabel: "沒有，未滿 50 kg",
    failMsg: "捐血需要 50 公斤以上，才能保護你的身體安全。繼續好好吃飯長壯！",
    waitTime: null,
  },
  {
    id: "health",
    label: "健康狀況",
    question: "今天身體有不舒服嗎？",
    hint: "包含發燒、感冒、喉嚨痛、咳嗽、頭痛等任何症狀",
    passLabel: "完全沒有，今天超健康！",
    failLabel: "有，感覺有點不對勁",
    failMsg: "有症狀時先好好休息，身體痊癒之後再來捐血，效果更好！",
    waitTime: "康復後即可",
  },
  {
    id: "tattoo",
    label: "刺青穿洞",
    question: "最近半年內有刺青或穿洞嗎？",
    hint: "包含穿耳洞、穿舌環、身體穿刺等行為",
    passLabel: "沒有",
    failLabel: "有，最近 6 個月內做過",
    failMsg: "刺青或穿洞後需等 6 個月才能捐血，避免潛在感染風險傳給受血者。",
    waitTime: "6 個月後",
  },
  {
    id: "surgery",
    label: "手術",
    question: "最近半年內有動手術嗎？",
    hint: "拔牙通常等 1 週即可；大手術需等更久",
    passLabel: "沒有",
    failLabel: "有動過手術",
    failMsg: "手術後身體需要恢復時間。建議致電血液基金會（0800-024-995）確認可捐血時間。",
    waitTime: "建議先諮詢醫師",
  },
  {
    id: "pregnant",
    label: "懷孕哺乳",
    question: "目前有懷孕或在哺乳嗎？",
    hint: "懷孕及哺乳期間請優先保護自身營養",
    passLabel: "沒有",
    failLabel: "有",
    failMsg: "懷孕和哺乳期間請先把自己照顧好！哺乳結束 6 個月後歡迎再來。",
    waitTime: "哺乳結束 6 個月後",
  },
  {
    id: "medication",
    label: "用藥",
    question: "有在服用特殊處方藥嗎？",
    hint: "如抗凝血劑、免疫抑制劑（一般維他命、感冒藥不算）",
    passLabel: "沒有，或只吃保健品",
    failLabel: "有，正在服用處方藥",
    failMsg: "有些藥物會影響血液品質。建議先諮詢血液基金會（0800-024-995）確認。",
    waitTime: null,
  },
  {
    id: "lastDonation",
    label: "上次捐血",
    question: "上次捐全血是什麼時候？",
    hint: "男女均需間隔 3 個月以上才能再次捐全血",
    passLabel: "超過 3 個月，或從未捐過",
    failLabel: "3 個月以內",
    failMsg: "全血需間隔至少 3 個月，讓身體充分製造新血球。快到了，再等等！",
    waitTime: "3 個月後",
  },
];

/* ─── Button Icons ───────────────────────────────────────────── */

function PassIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="14" fill="#f43f5e" />
      <path d="M8 14l4.5 4.5 7.5-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FailIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="14" fill="#d1d5db" />
      <path d="M10 10l8 8M18 10l-8 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── SVG helpers ────────────────────────────────────────────── */

function Sparkle({ x, y, size = 8, rotate = 0 }: { x: number; y: number; size?: number; rotate?: number }) {
  const s = size / 2;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`}>
      <rect x={-s * 0.18} y={-s} width={s * 0.36} height={s * 2} rx={s * 0.18} fill="#FFD700" />
      <rect x={-s} y={-s * 0.18} width={s * 2} height={s * 0.36} rx={s * 0.18} fill="#FFD700" />
    </g>
  );
}

function HeartEye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <path
      d={`M${cx},${cy - 2} C${cx},${cy - 4} ${cx - 4},${cy - 5} ${cx - 4},${cy - 2} C${cx - 4},${cy + 1} ${cx},${cy + 4} ${cx},${cy + 4} C${cx},${cy + 4} ${cx + 4},${cy + 1} ${cx + 4},${cy - 2} C${cx + 4},${cy - 5} ${cx},${cy - 4} ${cx},${cy - 2} Z`}
      fill="white"
    />
  );
}

/* ─── Blood Drop Mascot SVG ──────────────────────────────────── */

type Mood = "neutral" | "thinking" | "happy" | "sad" | "celebrate";

function BloodDropMascot({ mood }: { mood: Mood }) {
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="dropRG" cx="35%" cy="26%" r="70%">
          <stop offset="0%" stopColor={mood === "sad" ? "#d97575" : "#ff8585"} />
          <stop offset="100%" stopColor={mood === "celebrate" ? "#bf3030" : "#a93226"} />
        </radialGradient>
      </defs>

      <path d="M50 8 C65 25,84 50,84 72 A34 34 0 1 1 16 72 C16 50,35 25,50 8 Z" fill="url(#dropRG)" />
      <ellipse cx="34" cy="50" rx="7" ry="13" fill="rgba(255,255,255,0.22)" transform="rotate(-22,34,50)" />
      <ellipse cx="43" cy="36" rx="3" ry="5" fill="rgba(255,255,255,0.12)" />

      {(mood === "neutral" || mood === "thinking") && (
        <>
          <circle cx="37" cy="70" r="5.5" fill="white" />
          <circle cx="63" cy="70" r="5.5" fill="white" />
          <circle cx="38.5" cy="68.8" r="2.8" fill="#3d0a0a" />
          <circle cx="64.5" cy="68.8" r="2.8" fill="#3d0a0a" />
          <circle cx="39.5" cy="67.5" r="1" fill="white" />
          <circle cx="65.5" cy="67.5" r="1" fill="white" />
          {mood === "thinking" && (
            <path d="M58 61 Q63 57.5 68 61" stroke="rgba(255,255,255,0.65)" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
        </>
      )}
      {mood === "happy" && (
        <>
          <path d="M31 71 Q37 63 43 71" stroke="white" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M57 71 Q63 63 69 71" stroke="white" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <ellipse cx="27" cy="78" rx="7.5" ry="4.5" fill="rgba(255,180,180,0.42)" />
          <ellipse cx="73" cy="78" rx="7.5" ry="4.5" fill="rgba(255,180,180,0.42)" />
        </>
      )}
      {mood === "sad" && (
        <>
          <path d="M31 68 Q37 75 43 68" stroke="white" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M57 68 Q63 75 69 68" stroke="white" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <ellipse cx="33" cy="77" rx="2.2" ry="4" fill="rgba(173,220,255,0.85)" />
          <ellipse cx="67" cy="77" rx="2.2" ry="4" fill="rgba(173,220,255,0.85)" />
        </>
      )}
      {mood === "celebrate" && (
        <>
          <HeartEye cx={37} cy={70} />
          <HeartEye cx={63} cy={70} />
          <ellipse cx="25" cy="80" rx="8" ry="5" fill="rgba(255,180,180,0.48)" />
          <ellipse cx="75" cy="80" rx="8" ry="5" fill="rgba(255,180,180,0.48)" />
          <Sparkle x={14} y={30} size={10} rotate={15} />
          <Sparkle x={84} y={20} size={8} rotate={-10} />
          <Sparkle x={87} y={52} size={7} rotate={30} />
        </>
      )}

      {mood === "neutral"   && <path d="M40 84 Q50 84 60 84"  stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" />}
      {mood === "thinking"  && <path d="M40 85 Q50 81.5 59 86" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" />}
      {mood === "happy"     && <path d="M36 82 Q50 94 64 82"  stroke="white" strokeWidth="3.2" fill="none" strokeLinecap="round" />}
      {mood === "sad"       && <path d="M36 91 Q50 83 64 91"  stroke="white" strokeWidth="3.2" fill="none" strokeLinecap="round" />}
      {mood === "celebrate" && <path d="M33 83 Q50 99 67 83"  stroke="white" strokeWidth="3.5" fill="rgba(255,255,255,0.15)" strokeLinecap="round" />}
    </svg>
  );
}

/* ─── Animated Mascot: draggable + mood spring ───────────────── */

type MoodAnim = {
  animate: { y?: number[]; rotate?: number[]; scale?: number[] };
  transition: Transition;
};

const mascotAnimations: Record<Mood, MoodAnim> = {
  neutral:   { animate: { y: [0, -10, 0] },                                                                           transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } },
  thinking:  { animate: { y: [0, -10, 0] },                                                                           transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } },
  happy:     { animate: { rotate: [-8, 8, -5, 5, -2, 0], scale: [1, 1.12, 1.06, 1.04, 1.01, 1] },                   transition: { duration: 0.55, ease: "easeOut" } },
  sad:       { animate: { rotate: [0, -4, 4, -2, 0], y: [0, 6, 2, 0] },                                              transition: { duration: 0.65, ease: "easeOut" } },
  celebrate: { animate: { y: [0, -28, 4, -18, 2, -10, 0], rotate: [0, -10, 10, -6, 6, -2, 0], scale: [1, 1.15, 0.94, 1.1, 0.97, 1.06, 1] }, transition: { duration: 1.0, ease: "easeOut" } },
};

function AnimatedMascot({ mood }: { mood: Mood }) {
  const { animate, transition } = mascotAnimations[mood];
  return (
    // Outer: drag layer — snaps back via dragConstraints + dragElastic
    <motion.div
      drag
      dragConstraints={{ top: -45, bottom: 45, left: -55, right: 55 }}
      dragElastic={0.35}
      dragTransition={{ bounceStiffness: 550, bounceDamping: 14 }}
      whileDrag={{ scale: 1.18, rotate: 8 }}
      className="w-28 h-32 cursor-grab active:cursor-grabbing select-none touch-none"
    >
      {/* Inner: mood animation layer */}
      <motion.div
        key={mood}
        animate={animate}
        transition={transition}
        className="w-full h-full"
      >
        <BloodDropMascot mood={mood} />
      </motion.div>
    </motion.div>
  );
}

/* ─── canvas-confetti burst ──────────────────────────────────── */

function fireConfetti() {
  const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6b9d", "#c77dff", "#ff9a3c"];

  // Centre burst
  confetti({
    particleCount: 130,
    spread: 80,
    origin: { y: 0.55 },
    colors,
    gravity: 1.1,
    scalar: 1.1,
  });

  // Side cannons with slight delay
  setTimeout(() => {
    confetti({ particleCount: 70, angle: 55, spread: 60, origin: { x: 0, y: 0.6 }, colors, gravity: 1.2 });
    confetti({ particleCount: 70, angle: 125, spread: 60, origin: { x: 1, y: 0.6 }, colors, gravity: 1.2 });
  }, 280);

  // Final small shower
  setTimeout(() => {
    confetti({ particleCount: 40, spread: 100, origin: { y: 0.3 }, colors, scalar: 0.8 });
  }, 550);
}

/* ─── Pass Result (fires confetti on mount) ──────────────────── */

function PassResult({ onRestart }: { onRestart: () => void }) {
  useEffect(() => { fireConfetti(); }, []);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-emerald-200 p-7 text-center">
      <motion.div
        className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.05 }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path d="M7 18l7.5 7.5L29 10" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      <motion.h2
        className="text-2xl font-bold text-emerald-600 mb-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
      >
        可以捐血！
      </motion.h2>

      <motion.p
        className="text-gray-500 text-sm leading-relaxed mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32 }}
      >
        你符合捐血資格，謝謝你願意伸出援手<br />
        快去找附近的捐血活動吧！
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.42 }}
      >
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-base shadow-md mb-3"
        >
          <MapPin size={18} />
          查詢附近捐血活動
        </Link>
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 w-full py-3 text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          <RotateCcw size={14} />
          重新測驗
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Fail Result ────────────────────────────────────────────── */

function FailResult({ failReason, onRestart }: {
  failReason: { msg: string; waitTime: string | null };
  onRestart: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-7 text-center">
      <motion.div
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 border-4 border-orange-200 flex items-center justify-center"
        initial={{ scale: 0, rotate: 20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.05 }}
      >
        <Clock className="w-7 h-7 text-orange-400" />
      </motion.div>

      <motion.h2
        className="text-xl font-bold text-orange-600 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
      >
        這次暫時不行
      </motion.h2>

      <motion.p
        className="text-gray-600 text-sm leading-relaxed mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {failReason.msg}
      </motion.p>

      {failReason.waitTime && (
        <motion.div
          className="flex items-center justify-center gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-5"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 450, damping: 18, delay: 0.38 }}
        >
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          <span className="text-orange-700 text-sm font-medium">
            {failReason.waitTime}再來捐血
          </span>
        </motion.div>
      )}

      <p className="text-xs text-gray-400 mb-5">
        有疑問可撥打捐血諮詢專線{" "}
        <a href="tel:0800024995" className="text-rose-500 font-medium underline underline-offset-2">
          0800-024-995
        </a>
      </p>

      <motion.button
        onClick={onRestart}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scaleX: 1.05, scaleY: 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="flex items-center justify-center gap-2 w-full py-4 border-2 border-rose-200 bg-rose-50 text-rose-600 font-bold rounded-2xl"
      >
        <RotateCcw size={17} />
        重新測驗
      </motion.button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function EligibilityClient() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [mood, setMood] = useState<Mood>("neutral");
  const [result, setResult] = useState<"pass" | "fail" | null>(null);
  const [failReason, setFailReason] = useState<{ msg: string; waitTime: string | null } | null>(null);

  const totalQuestions = QUESTIONS.length;
  const currentQuestion = step >= 1 && step <= totalQuestions ? QUESTIONS[step - 1] : null;
  const pct = step >= 1 && step <= totalQuestions ? Math.round((step / totalQuestions) * 100) : 0;

  function startQuiz() {
    setDir(1);
    setMood("thinking");
    setStep(1);
  }

  function handleAnswer(isPassing: boolean) {
    if (!currentQuestion) return;
    setDir(1);

    if (!isPassing) {
      setMood("sad");
      setResult("fail");
      setFailReason({ msg: currentQuestion.failMsg, waitTime: currentQuestion.waitTime });
      setStep(totalQuestions + 1);
      return;
    }
    if (step === totalQuestions) {
      setMood("celebrate");
      setResult("pass");
      setStep(totalQuestions + 1);
      return;
    }
    setMood("happy");
    setStep((s) => s + 1);
    setTimeout(() => setMood("thinking"), 520);
  }

  function restart() {
    setDir(-1);
    setStep(0);
    setResult(null);
    setFailReason(null);
    setMood("neutral");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-rose-50/40 to-white">
      <div className="max-w-md mx-auto px-4 pt-8 pb-16">

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-rose-700">我可以捐血嗎？</h1>
          <p className="text-sm text-rose-400 mt-1">拖動我，8 題快速測驗知道結果</p>
        </div>

        {/* Draggable mascot */}
        <div className="flex justify-center mb-5">
          <AnimatedMascot mood={mood} />
        </div>

        {/* Progress bar */}
        {step >= 1 && step <= totalQuestions && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-rose-400 mb-1.5 font-medium">
              <span>進度</span>
              <span>{step} / {totalQuestions}</span>
            </div>
            <div className="h-3 bg-rose-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-400 to-red-500 rounded-full origin-left"
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
              />
            </div>
          </div>
        )}

        {/* Cards */}
        <div className="relative" style={{ minHeight: 300 }}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={step}
              initial={{ x: dir * 80, opacity: 0, scale: 0.92, rotate: dir * 3 }}
              animate={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
              exit={{ x: dir * -80, opacity: 0, scale: 0.92, rotate: dir * -3 }}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
            >

              {/* ── Intro ── */}
              {step === 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-7">
                  <p className="text-center text-gray-500 text-sm mb-5 leading-relaxed">
                    不確定自己能不能捐血？<br />
                    根據台灣血液基金會標準，一起來確認
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 mb-7">
                    {["年齡 & 體重", "今日健康狀況", "最近手術 / 刺青", "用藥情形"].map((item, i) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.08 + i * 0.07 }}
                        className="flex items-center gap-2 bg-rose-50 rounded-xl px-3 py-2.5 text-sm text-gray-600"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                        {item}
                      </motion.div>
                    ))}
                  </div>
                  <motion.button
                    onClick={startQuiz}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scaleX: 1.05, scaleY: 0.91 }}
                    transition={{ type: "spring", stiffness: 500, damping: 14 }}
                    className="w-full py-4 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-2xl font-bold text-lg shadow-md"
                  >
                    開始測驗
                  </motion.button>
                </div>
              )}

              {/* ── Question ── */}
              {currentQuestion && (
                <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-7">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold text-rose-400 bg-rose-50 px-2.5 py-1 rounded-full">
                      {currentQuestion.label}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{currentQuestion.question}</h2>
                  <p className="text-xs text-gray-400 leading-relaxed mb-6">{currentQuestion.hint}</p>

                  <div className="space-y-3">
                    {/* Pass button — squish on tap */}
                    <motion.button
                      onClick={() => handleAnswer(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scaleX: 1.04, scaleY: 0.92 }}
                      transition={{ type: "spring", stiffness: 600, damping: 14 }}
                      className="w-full py-4 px-5 bg-rose-50 border-2 border-rose-200 hover:border-rose-400 text-rose-700 font-semibold rounded-2xl flex items-center gap-3.5 text-left"
                    >
                      <PassIcon />
                      <span className="flex-1 text-sm leading-snug">{currentQuestion.passLabel}</span>
                    </motion.button>

                    {/* Fail button */}
                    <motion.button
                      onClick={() => handleAnswer(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scaleX: 1.04, scaleY: 0.92 }}
                      transition={{ type: "spring", stiffness: 600, damping: 14 }}
                      className="w-full py-4 px-5 bg-gray-50 border-2 border-gray-200 hover:border-gray-400 text-gray-600 font-semibold rounded-2xl flex items-center gap-3.5 text-left"
                    >
                      <FailIcon />
                      <span className="flex-1 text-sm leading-snug">{currentQuestion.failLabel}</span>
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ── Results ── */}
              {result === "pass" && <PassResult onRestart={restart} />}
              {result === "fail" && failReason && <FailResult failReason={failReason} onRestart={restart} />}

            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
          本測驗僅供參考，依台灣血液基金會公告標準。<br />
          實際捐血資格以現場醫護人員判斷為準。
        </p>
      </div>
    </div>
  );
}
