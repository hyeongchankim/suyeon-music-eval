"use client";

import { useTransition } from "react";

export default function OptInButton({
  optedIn,
  disabled,
  action,
  onLabel = "참여 취소",
  offLabel = "참여 신청",
}: {
  optedIn: boolean;
  disabled?: boolean;
  action: (optIn: boolean) => Promise<{ ok?: boolean; error?: string }>;
  onLabel?: string;
  offLabel?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      className={optedIn ? "btn-ghost" : "btn-accent"}
      disabled={disabled || pending}
      onClick={() => start(() => action(!optedIn).then(() => undefined))}
    >
      {pending ? "처리 중..." : optedIn ? onLabel : offLabel}
    </button>
  );
}
