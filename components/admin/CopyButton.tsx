"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "문구 복사" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="whitespace-nowrap text-xs text-primary hover:underline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          window.prompt("아래 문구를 복사해서 사용하세요", text);
        }
      }}
    >
      {done ? "복사됨" : label}
    </button>
  );
}
