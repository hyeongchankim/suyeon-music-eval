"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ROLL_MS = 5000;

const items = [
  {
    quote:
      "실제 시험장과 똑같은 긴장감이었어요. 본 시험 때 훨씬 덜 떨렸습니다.",
    who: "피아노 · 2025 합격생",
  },
  {
    quote: "곡별로 점수와 코멘트가 나눠져 있어서 뭘 고쳐야 할지 명확했어요.",
    who: "피아노 · 재수생",
  },
  {
    quote: "심사평이 솔직하고 구체적이라, 다음 레슨 방향을 바로 잡을 수 있었습니다.",
    who: "학부모",
  },
];

export default function TestimonialSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const move = (d: number) => setI((v) => (v + d + items.length) % items.length);

  // 자동 롤링 (마우스 오버 시 일시정지)
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => move(1), ROLL_MS);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="card mx-auto max-w-2xl p-8 text-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span aria-live="polite" className="sr-only">
        후기 {i + 1} / {items.length}
      </span>
      <p className="text-lg leading-relaxed text-ink">“{items[i].quote}”</p>
      <p className="mt-4 text-sm text-ink/60">{items[i].who}</p>
      <div className="mt-6 flex items-center justify-center gap-4">
        <button onClick={() => move(-1)} aria-label="이전 후기" className="btn-ghost !min-h-0 !px-3 !py-2">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm text-ink/50">
          {i + 1} / {items.length}
        </span>
        <button onClick={() => move(1)} aria-label="다음 후기" className="btn-ghost !min-h-0 !px-3 !py-2">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
