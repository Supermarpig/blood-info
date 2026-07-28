"use client";

import { useRef, useState } from "react";
import Link from "@/components/Link";
import { Check, X, RotateCcw, ArrowRight, MapPin } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import confetti from "canvas-confetti";
import { MYTH_QUESTIONS, getScoreTier } from "@/lib/mythQuizData";
import QuizShareButtons from "@/components/QuizShareButtons";

gsap.registerPlugin(useGSAP);

const TOTAL = MYTH_QUESTIONS.length;

function fireConfetti() {
  const colors = ["#111827", "#6b7280", "#ef4444", "#d1d5db"];
  confetti({ particleCount: 110, spread: 75, origin: { y: 0.55 }, colors, gravity: 1.1, scalar: 1.05 });
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 55, spread: 55, origin: { x: 0, y: 0.6 }, colors, gravity: 1.15 });
    confetti({ particleCount: 60, angle: 125, spread: 55, origin: { x: 1, y: 0.6 }, colors, gravity: 1.15 });
  }, 260);
}

export default function MythQuizClient({ pageUrl }: { pageUrl: string }) {
  const [step, setStep] = useState(0); // 0 = intro, 1..TOTAL = question, TOTAL+1 = result
  const [dir, setDir] = useState(1);
  const [results, setResults] = useState<(boolean | null)[]>(Array(TOTAL).fill(null));
  const [revealed, setRevealed] = useState(false);
  const [pickedTrue, setPickedTrue] = useState<boolean | null>(null);

  const currentQuestion = step >= 1 && step <= TOTAL ? MYTH_QUESTIONS[step - 1] : null;
  const pct = step >= 1 && step <= TOTAL ? Math.round((step / TOTAL) * 100) : 0;
  const correctCount = results.filter(Boolean).length;

  const cardRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const firedConfetti = useRef(false);

  useGSAP(
    () => {
      if (!cardRef.current) return;
      gsap.fromTo(
        cardRef.current,
        { x: dir * 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    },
    { dependencies: [step, dir], revertOnUpdate: true }
  );

  useGSAP(() => {
    if (!progressRef.current) return;
    gsap.to(progressRef.current, { scaleX: pct / 100, duration: 0.5, ease: "power2.out" });
  }, { dependencies: [pct] });

  useGSAP(
    () => {
      if (step === TOTAL + 1 && correctCount === TOTAL && !firedConfetti.current) {
        firedConfetti.current = true;
        fireConfetti();
      }
    },
    { dependencies: [step, correctCount] }
  );

  function startQuiz() {
    setDir(1);
    setStep(1);
  }

  function pick(value: boolean) {
    if (revealed || !currentQuestion) return;
    setPickedTrue(value);
    setRevealed(true);
    setResults((prev) => {
      const next = [...prev];
      next[step - 1] = value === currentQuestion.isTrue;
      return next;
    });
  }

  function next() {
    setDir(1);
    if (step === TOTAL) {
      setStep(TOTAL + 1);
      return;
    }
    setStep((s) => s + 1);
    setRevealed(false);
    setPickedTrue(null);
  }

  function restart() {
    setDir(-1);
    setStep(0);
    setResults(Array(TOTAL).fill(null));
    setRevealed(false);
    setPickedTrue(null);
    firedConfetti.current = false;
  }

  const tier = getScoreTier(correctCount);

  return (
    <div className="mx-auto max-w-md">
      {step >= 1 && step <= TOTAL && (
        <div className="mb-5">
          <div className="mb-1.5 flex justify-between text-xs font-medium text-gray-400">
            <span>進度</span>
            <span>
              {step} / {TOTAL}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              ref={progressRef}
              className="h-full origin-left rounded-full bg-gray-900"
              style={{ width: "100%", transform: "scaleX(0)" }}
            />
          </div>
        </div>
      )}

      <div ref={cardRef}>
        {step === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="mb-5 text-sm leading-relaxed text-gray-500">
              「捐血會變虛弱」「刺青這輩子不能捐血」……這些說法你分得出真假嗎？
              <br />
              10 題快速挑戰，測出你破解了多少捐血迷思。
            </p>
            <button
              type="button"
              onClick={startQuiz}
              className="w-full rounded-xl bg-gray-900 py-3.5 text-base font-semibold text-white transition-colors hover:bg-gray-800"
            >
              開始挑戰
            </button>
          </div>
        )}

        {currentQuestion && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <span className="mb-3 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
              第 {step} 題
            </span>
            <h2 className="mb-5 text-lg font-bold leading-snug text-gray-900">
              {currentQuestion.statement}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { label: "這是真的", value: true },
                  { label: "這是假的", value: false },
                ] as const
              ).map((opt) => {
                const isPicked = revealed && pickedTrue === opt.value;
                const isCorrectAnswer = revealed && currentQuestion.isTrue === opt.value;
                let tone = "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50";
                if (revealed && isCorrectAnswer) tone = "border-emerald-400 bg-emerald-50 text-emerald-700";
                else if (revealed && isPicked) tone = "border-rose-300 bg-rose-50 text-rose-600";
                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={revealed}
                    onClick={() => pick(opt.value)}
                    className={`rounded-xl border py-3.5 text-sm font-semibold transition-colors ${tone}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  {pickedTrue === currentQuestion.isTrue ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      答對了
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-rose-400" />
                      答錯了，正確答案是「{currentQuestion.isTrue ? "真的" : "假的"}」
                    </>
                  )}
                </p>
                <p className="text-sm leading-relaxed text-gray-600">{currentQuestion.explanation}</p>
                <button
                  type="button"
                  onClick={next}
                  className="mt-4 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  {step === TOTAL ? "看我的結果" : "下一題"}
                </button>
              </div>
            )}
          </div>
        )}

        {step === TOTAL + 1 && (
          <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-7 text-center">
              <p className="text-sm font-semibold text-gray-500">你的結果</p>
              <p className="mt-1 text-4xl font-bold text-gray-900">
                {correctCount} <span className="text-lg font-medium text-gray-400">/ {TOTAL}</span>
              </p>
              <p className="mt-3 text-lg font-bold text-gray-800">{tier.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{tier.desc}</p>

              <button
                type="button"
                onClick={restart}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重新挑戰
              </button>
            </div>

            <div className="mt-4">
              <QuizShareButtons
                shareText={`我剛做了「捐血迷思大挑戰」，10 題答對 ${correctCount} 題，等級：${tier.title}！你也來測測看破解了多少捐血迷思 → ${pageUrl}`}
                shareUrl={pageUrl}
                label="分享你的分數"
              />
            </div>

            <Link
              href="/eligibility"
              className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <span>
                <span className="block text-sm font-semibold text-gray-800">我可以捐血嗎？</span>
                <span className="mt-0.5 block text-xs text-gray-500">8 題測出你今天符不符合捐血資格</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
            </Link>

            <Link
              href="/blood-shortage"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <MapPin className="h-4 w-4" />
              查今天缺什麼血型
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
